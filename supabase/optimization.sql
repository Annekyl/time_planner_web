-- Database Optimization Indexes

-- 提升 tasks 表基于用户ID和状态的联合查询速度
CREATE INDEX IF NOT EXISTS idx_tasks_user_id_status ON public.tasks (user_id, status);

-- 提升 tasks 表基于用户ID和截止日期的查询速度
CREATE INDEX IF NOT EXISTS idx_tasks_user_id_due_date ON public.tasks (user_id, due_date);

-- 提升 time_blocks 表基于用户ID和日期的查询速度
CREATE INDEX IF NOT EXISTS idx_time_blocks_user_id_date ON public.time_blocks (user_id, date);

-- 提升 goals 表基于用户ID的查询速度
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals (user_id);
