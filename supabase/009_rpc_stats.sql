-- ============================================
-- SQL 迁移脚本: 添加聚合查询与仪表盘查询 RPC
-- ============================================

-- 1. 获取统计页的数据
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
  v_total_tasks INT;
  v_completed_tasks INT;
  v_pending_tasks INT;
  v_in_progress_tasks INT;
  v_total_blocks INT;
  v_total_block_minutes INT;
  v_active_goals INT;
  v_avg_goal_progress INT;
  v_daily_completions JSON;
  v_category_stats JSON;
  v_completed_list JSON;
  v_in_progress_list JSON;
  v_active_goals_list JSON;
BEGIN
  -- 基础数量统计
  SELECT count(*) INTO v_total_tasks FROM tasks WHERE user_id = user_uuid;
  SELECT count(*) INTO v_completed_tasks FROM tasks WHERE user_id = user_uuid AND status = 'completed';
  SELECT count(*) INTO v_pending_tasks FROM tasks WHERE user_id = user_uuid AND status = 'pending';
  SELECT count(*) INTO v_in_progress_tasks FROM tasks WHERE user_id = user_uuid AND status = 'in_progress';
  
  -- 时间块统计
  SELECT count(*) INTO v_total_blocks FROM time_blocks WHERE user_id = user_uuid;
  
  SELECT COALESCE(SUM(
    (EXTRACT(EPOCH FROM end_time::time) - EXTRACT(EPOCH FROM start_time::time)) / 60
  ), 0) INTO v_total_block_minutes FROM time_blocks WHERE user_id = user_uuid;

  -- 目标统计
  SELECT count(*) INTO v_active_goals FROM goals WHERE user_id = user_uuid AND status = 'active';
  SELECT COALESCE(AVG(progress), 0) INTO v_avg_goal_progress FROM goals WHERE user_id = user_uuid AND status = 'active';
  
  -- 饼图分类统计
  SELECT json_agg(row_to_json(cat_stats)) INTO v_category_stats
  FROM (
    SELECT 
      c.id, c.name, c.color,
      count(t.id) as count,
      count(t.id) FILTER (WHERE t.status = 'completed') as completed
    FROM categories c
    LEFT JOIN tasks t ON t.category_id = c.id AND t.user_id = user_uuid
    WHERE c.user_id = user_uuid
    GROUP BY c.id, c.name, c.color
    HAVING count(t.id) > 0
  ) cat_stats;

  -- 近7天完成趋势
  SELECT json_agg(row_to_json(daily)) INTO v_daily_completions
  FROM (
    SELECT 
      to_char(d.date, 'MM/DD') as date,
      to_char(d.date, 'YYYY-MM-DD') as full_date,
      count(t.id) as count
    FROM (
      SELECT generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day')::date AS date
    ) d
    LEFT JOIN tasks t ON t.user_id = user_uuid AND t.status = 'completed' AND t.completed_at::date = d.date
    GROUP BY d.date
    ORDER BY d.date
  ) daily;

  -- 最近的已完成任务 (列表渲染用，最多取50条)
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO v_completed_list 
  FROM (SELECT *, (SELECT row_to_json(c) FROM categories c WHERE c.id = tasks.category_id) as category FROM tasks WHERE user_id = user_uuid AND status = 'completed' ORDER BY completed_at DESC NULLS LAST LIMIT 50) t;

  -- 进行中任务 (列表渲染用，最多取50条)
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO v_in_progress_list 
  FROM (SELECT *, (SELECT row_to_json(c) FROM categories c WHERE c.id = tasks.category_id) as category FROM tasks WHERE user_id = user_uuid AND status = 'in_progress' ORDER BY created_at DESC LIMIT 50) t;

  -- 活跃目标 (列表渲染用)
  SELECT COALESCE(json_agg(row_to_json(g)), '[]'::json) INTO v_active_goals_list 
  FROM (SELECT * FROM goals WHERE user_id = user_uuid AND status = 'active' ORDER BY target_date ASC NULLS LAST) g;

  result := json_build_object(
    'totalTasks', v_total_tasks,
    'completedTasks', v_completed_tasks,
    'pendingTasks', v_pending_tasks,
    'inProgressTasks', v_in_progress_tasks,
    'totalBlocks', v_total_blocks,
    'totalBlockHours', ROUND(v_total_block_minutes::numeric / 60, 1),
    'activeGoals', v_active_goals,
    'avgGoalProgress', v_avg_goal_progress,
    'categoryStats', COALESCE(v_category_stats, '[]'::json),
    'dailyCompletions', COALESCE(v_daily_completions, '[]'::json),
    'completedTasksList', v_completed_list,
    'inProgressTasksList', v_in_progress_list,
    'activeGoalsList', v_active_goals_list
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 2. 获取仪表盘首页的数据
CREATE OR REPLACE FUNCTION get_dashboard_data(user_uuid UUID, current_date_str TEXT)
RETURNS JSON AS $$
DECLARE
  v_today_tasks JSON;
  v_pending_tasks JSON;
  v_today_blocks JSON;
  v_active_goals JSON;
  v_upcoming_tasks JSON;
BEGIN
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO v_today_tasks 
  FROM (SELECT *, (SELECT row_to_json(c) FROM categories c WHERE c.id = tasks.category_id) as category FROM tasks WHERE user_id = user_uuid AND due_date = current_date_str ORDER BY priority DESC, created_at DESC) t;
  
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO v_pending_tasks 
  FROM (SELECT *, (SELECT row_to_json(c) FROM categories c WHERE c.id = tasks.category_id) as category FROM tasks WHERE user_id = user_uuid AND status IN ('pending', 'in_progress') ORDER BY priority DESC, created_at DESC LIMIT 50) t;
  
  SELECT COALESCE(json_agg(row_to_json(b)), '[]'::json) INTO v_today_blocks 
  FROM (SELECT *, (SELECT row_to_json(c) FROM categories c WHERE c.id = time_blocks.category_id) as category FROM time_blocks WHERE user_id = user_uuid AND date = current_date_str ORDER BY start_time) b;
  
  SELECT COALESCE(json_agg(row_to_json(g)), '[]'::json) INTO v_active_goals 
  FROM (SELECT * FROM goals WHERE user_id = user_uuid AND status = 'active' ORDER BY target_date ASC NULLS LAST) g;
  
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO v_upcoming_tasks 
  FROM (SELECT *, (SELECT row_to_json(c) FROM categories c WHERE c.id = tasks.category_id) as category FROM tasks WHERE user_id = user_uuid AND due_date IS NOT NULL AND due_date >= current_date_str AND status NOT IN ('completed', 'cancelled') ORDER BY due_date ASC LIMIT 5) t;

  RETURN json_build_object(
    'todayTasks', v_today_tasks,
    'pendingTasks', v_pending_tasks,
    'todayBlocks', v_today_blocks,
    'activeGoals', v_active_goals,
    'upcomingTasks', v_upcoming_tasks
  );
END;
$$ LANGUAGE plpgsql;
