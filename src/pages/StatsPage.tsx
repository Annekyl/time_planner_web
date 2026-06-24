import { useMemo } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useTasks } from '../hooks/useTasks'
import { useGoals } from '../hooks/useGoals'
import { useTimeBlocks } from '../hooks/useTimeBlocks'
import { BarChart3, TrendingUp, CheckCircle, Clock, Target } from 'lucide-react'
import { format, subDays, parseISO, eachDayOfInterval } from 'date-fns'

export default function StatsPage() {
  const { user } = useAuth()
  const { tasks, categories } = useTasks(user?.id)
  const { goals } = useGoals(user?.id)
  const { timeBlocks } = useTimeBlocks(user?.id)

  const stats = useMemo(() => {
    const now = new Date()
    const last7Days = subDays(now, 6)
    const completedTasks = tasks.filter(t => t.status === 'completed')
    const pendingTasks = tasks.filter(t => t.status === 'pending')
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress')
    const days = eachDayOfInterval({ start: last7Days, end: now })
    const dailyCompletions = days.map(day => { const dayStr = format(day, 'yyyy-MM-dd'); return { date: format(day, 'M/d'), count: completedTasks.filter(t => t.completed_at && format(parseISO(t.completed_at), 'yyyy-MM-dd') === dayStr).length } })
    const totalBlockHours = timeBlocks.reduce((acc, b) => { const [sh, sm] = b.start_time.split(':').map(Number); const [eh, em] = b.end_time.split(':').map(Number); return acc + ((eh * 60 + em) - (sh * 60 + sm)) / 60 }, 0)
    const categoryStats = categories.map(c => ({ name: c.name, color: c.color, count: tasks.filter(t => t.category_id === c.id).length, completed: completedTasks.filter(t => t.category_id === c.id).length })).filter(c => c.count > 0)
    const activeGoals = goals.filter(g => g.status === 'active')
    const avgGoalProgress = activeGoals.length > 0 ? Math.round(activeGoals.reduce((sum, g) => sum + g.progress, 0) / activeGoals.length) : 0
    const maxDailyCount = Math.max(...dailyCompletions.map(d => d.count), 1)
    return { totalTasks: tasks.length, completedTasks: completedTasks.length, pendingTasks: pendingTasks.length, inProgressTasks: inProgressTasks.length, completionRate: tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0, totalBlocks: timeBlocks.length, totalBlockHours: totalBlockHours.toFixed(1), categoryStats, activeGoals: activeGoals.length, avgGoalProgress, dailyCompletions, maxDailyCount }
  }, [tasks, goals, timeBlocks, categories])

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4 md:mb-6 fade-in">数据统计</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <StatCard icon={CheckCircle} label="已完成" value={stats.completedTasks} color="bg-green-500" className="stagger-1 fade-in" />
        <StatCard icon={Clock} label="进行中" value={stats.inProgressTasks} color="bg-blue-500" className="stagger-2 fade-in" />
        <StatCard icon={BarChart3} label="完成率" value={`${stats.completionRate}%`} color="bg-purple-500" className="stagger-3 fade-in" />
        <StatCard icon={Target} label="活跃目标" value={stats.activeGoals} color="bg-amber-500" className="stagger-4 fade-in" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 md:p-6 card-hover fade-in" style={{ animationDelay: '0.15s' }}>
          <h2 className="text-base md:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3 md:mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-indigo-500" />近7天任务完成趋势</h2>
          <div className="flex items-end gap-1 md:gap-2 h-32 md:h-40">
            {stats.dailyCompletions.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5 md:gap-1">
                <span className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">{day.count}</span>
                <div className="w-full bg-indigo-500 rounded-t transition-all duration-500 min-h-[4px] hover:bg-indigo-600" style={{ height: `${(day.count / stats.maxDailyCount) * 100}%`, transitionDelay: `${i * 50}ms` }} />
                <span className="text-[10px] md:text-xs text-gray-400 dark:text-gray-500">{day.date}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 md:p-6 card-hover fade-in" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-base md:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3 md:mb-4 flex items-center gap-2"><BarChart3 size={18} className="text-purple-500" />分类统计</h2>
          {stats.categoryStats.length === 0 ? <p className="text-gray-400 dark:text-gray-500 text-sm">暂无分类数据</p> : (
            <div className="space-y-3">
              {stats.categoryStats.map((cat, i) => (
                <div key={cat.name} className="fade-in" style={{ animationDelay: `${0.05 * (i + 1)}s` }}>
                  <div className="flex items-center justify-between mb-1"><span className="text-sm text-gray-700 dark:text-gray-300">{cat.name}</span><span className="text-xs text-gray-500 dark:text-gray-400">{cat.completed}/{cat.count} 已完成</span></div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden"><div className="h-2 rounded-full progress-bar" style={{ width: `${cat.count > 0 ? (cat.completed / cat.count) * 100 : 0}%`, backgroundColor: cat.color }} /></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 md:p-6 card-hover fade-in" style={{ animationDelay: '0.25s' }}>
          <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-3 text-sm md:text-base">任务概览</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span className="text-gray-500 dark:text-gray-400">总任务数</span><span className="font-medium text-gray-800 dark:text-gray-200">{stats.totalTasks}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500 dark:text-gray-400">待办</span><span className="font-medium text-gray-800 dark:text-gray-200">{stats.pendingTasks}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500 dark:text-gray-400">已完成</span><span className="font-medium text-green-600 dark:text-green-400">{stats.completedTasks}</span></div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 md:p-6 card-hover fade-in" style={{ animationDelay: '0.3s' }}>
          <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-3 text-sm md:text-base">时间块统计</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span className="text-gray-500 dark:text-gray-400">总时间块</span><span className="font-medium text-gray-800 dark:text-gray-200">{stats.totalBlocks}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500 dark:text-gray-400">总规划时长</span><span className="font-medium text-gray-800 dark:text-gray-200">{stats.totalBlockHours} 小时</span></div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 md:p-6 card-hover fade-in" style={{ animationDelay: '0.35s' }}>
          <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-3 text-sm md:text-base">目标进度</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span className="text-gray-500 dark:text-gray-400">活跃目标</span><span className="font-medium text-gray-800 dark:text-gray-200">{stats.activeGoals}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500 dark:text-gray-400">平均进度</span><span className="font-medium text-indigo-600 dark:text-indigo-400">{stats.avgGoalProgress}%</span></div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 mt-2 overflow-hidden"><div className="bg-indigo-500 h-3 rounded-full progress-bar" style={{ width: `${stats.avgGoalProgress}%` }} /></div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color, className = '' }: { icon: any; label: string; value: string | number; color: string; className?: string }) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 md:p-5 card-hover ${className}`}>
      <div className="flex items-center justify-between">
        <div><p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">{label}</p><p className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100 mt-0.5 md:mt-1">{value}</p></div>
        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl ${color} flex items-center justify-center transition-transform duration-300 hover:rotate-6 hover:scale-110`}><Icon size={20} className="text-white" /></div>
      </div>
    </div>
  )
}
