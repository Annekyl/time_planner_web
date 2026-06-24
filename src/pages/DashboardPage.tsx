import { useMemo } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useTasks } from '../hooks/useTasks'
import { useGoals } from '../hooks/useGoals'
import { useTimeBlocks } from '../hooks/useTimeBlocks'
import { CheckSquare, Target, Clock, TrendingUp, AlertCircle, Calendar } from 'lucide-react'
import { format, isToday, isTomorrow, parseISO } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export default function DashboardPage() {
  const { user } = useAuth()
  const { tasks } = useTasks(user?.id)
  const { goals } = useGoals(user?.id)
  const { timeBlocks } = useTimeBlocks(user?.id)

  const stats = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd')
    const todayTasks = tasks.filter(t => t.due_date === today)
    const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress')
    const todayBlocks = timeBlocks.filter(b => b.date === today)
    const activeGoals = goals.filter(g => g.status === 'active')

    const upcomingTasks = tasks
      .filter(t => t.due_date && t.status !== 'completed' && t.status !== 'cancelled')
      .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''))
      .slice(0, 5)

    return { todayTasks, pendingTasks, todayBlocks, activeGoals, upcomingTasks }
  }, [tasks, goals, timeBlocks])

  const priorityLabel: Record<number, string> = { 1: '低', 2: '中', 3: '高', 4: '紧急' }
  const priorityColor: Record<number, string> = {
    1: 'bg-gray-100 text-gray-600',
    2: 'bg-blue-100 text-blue-700',
    3: 'bg-orange-100 text-orange-700',
    4: 'bg-red-100 text-red-700',
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 md:mb-8 fade-in">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">
          {format(new Date(), 'yyyy年M月d日 EEEE', { locale: zhCN })}
        </h1>
        <p className="text-gray-500 mt-1 text-sm md:text-base">欢迎回来，开始规划你的一天吧</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <StatCard icon={CheckSquare} label="待办任务" value={stats.pendingTasks.length} color="bg-blue-500" className="stagger-1 fade-in" />
        <StatCard icon={Calendar} label="今日任务" value={stats.todayTasks.length} color="bg-purple-500" className="stagger-2 fade-in" />
        <StatCard icon={Target} label="进行中目标" value={stats.activeGoals.length} color="bg-green-500" className="stagger-3 fade-in" />
        <StatCard icon={Clock} label="今日时间块" value={stats.todayBlocks.length} color="bg-amber-500" className="stagger-4 fade-in" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 card-hover fade-in" style={{ animationDelay: '0.15s' }}>
          <h2 className="text-base md:text-lg font-semibold text-gray-800 mb-3 md:mb-4 flex items-center gap-2">
            <AlertCircle size={18} className="text-amber-500" />
            即将到来的任务
          </h2>
          {stats.upcomingTasks.length === 0 ? (
            <p className="text-gray-400 text-sm">暂无即将到来的任务</p>
          ) : (
            <div className="space-y-2 md:space-y-3">
              {stats.upcomingTasks.map(task => (
                <div key={task.id} className="flex items-center justify-between p-2.5 md:p-3 bg-gray-50 rounded-lg transition-all duration-200 hover:bg-gray-100">
                  <div className="flex items-center gap-2 md:gap-3 min-w-0">
                    <div className={`w-2 h-2 rounded-full shrink-0 transition-colors ${task.status === 'in_progress' ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`} />
                    <span className="text-sm text-gray-700 truncate">{task.title}</span>
                  </div>
                  <div className="flex items-center gap-1.5 md:gap-2 shrink-0 ml-2">
                    <span className={`text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full ${priorityColor[task.priority]}`}>
                      {priorityLabel[task.priority]}
                    </span>
                    {task.due_date && (
                      <span className="text-[10px] md:text-xs text-gray-400">
                        {isToday(parseISO(task.due_date)) ? '今天' :
                         isTomorrow(parseISO(task.due_date)) ? '明天' :
                         format(parseISO(task.due_date), 'M/d')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 card-hover fade-in" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-base md:text-lg font-semibold text-gray-800 mb-3 md:mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-green-500" />
            目标进度
          </h2>
          {stats.activeGoals.length === 0 ? (
            <p className="text-gray-400 text-sm">暂无进行中的目标</p>
          ) : (
            <div className="space-y-2 md:space-y-3">
              {stats.activeGoals.slice(0, 5).map(goal => (
                <div key={goal.id} className="p-2.5 md:p-3 bg-gray-50 rounded-lg transition-all duration-200 hover:bg-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 truncate mr-2">{goal.title}</span>
                    <span className="text-xs text-gray-500 shrink-0">{goal.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-2 rounded-full progress-bar"
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color, className = '' }: { icon: any; label: string; value: number; color: string; className?: string }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-5 card-hover ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs md:text-sm text-gray-500">{label}</p>
          <p className="text-xl md:text-2xl font-bold text-gray-800 mt-0.5 md:mt-1">{value}</p>
        </div>
        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl ${color} flex items-center justify-center transition-transform duration-300 hover:rotate-6 hover:scale-110`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </div>
  )
}
