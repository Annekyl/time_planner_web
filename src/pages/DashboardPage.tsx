import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useDashboard } from '../hooks/useDashboard'
import { CheckSquare, Target, Clock, TrendingUp, AlertCircle, Calendar, ListChecks } from 'lucide-react'
import { format, isToday, isTomorrow, parseISO, differenceInDays, startOfDay } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { motion, AnimatePresence, type Variants } from 'framer-motion'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { dashboardData } = useDashboard(user?.id)
  const [activeTab, setActiveTab] = useState<'overview' | 'pending' | 'today' | 'goals' | 'blocks'>('overview')

  const stats = dashboardData || { todayTasks: [], pendingTasks: [], todayBlocks: [], activeGoals: [], upcomingTasks: [] }

  const priorityLabel: Record<number, string> = { 1: '低', 2: '中', 3: '高', 4: '紧急' }
  const priorityColor: Record<number, string> = {
    1: 'bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-400',
    2: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    3: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    4: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  }

  const renderTaskItem = (task: any, idx: number) => (
    <motion.div 
      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
      key={task.id} 
      className="flex items-center justify-between p-3.5 bg-bg-secondary backdrop-blur-sm rounded-xl border border-white/20 dark:border-white/5 hover:border-[#D6D3CD] dark:hover:border-[#4A4844] transition-all duration-300 group"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-2.5 h-2.5 rounded-full shrink-0 shadow-sm ${task.status === 'in_progress' ? 'bg-blue-500 shadow-blue-500/50 animate-pulse' : 'bg-gray-300 dark:bg-gray-600'}`} />
        <span className="text-sm font-medium text-text-secondary truncate group-hover:text-brand dark:group-hover:text-indigo-400 transition-colors">{task.title}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-3">
        <span className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${priorityColor[task.priority]}`}>{priorityLabel[task.priority]}</span>
        {task.due_date && (
          <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800/80 px-2 py-0.5 rounded-md">
            {isToday(parseISO(task.due_date)) ? '今天' : isTomorrow(parseISO(task.due_date)) ? '明天' : format(parseISO(task.due_date), 'M/d')}
          </span>
        )}
      </div>
    </motion.div>
  )

  const renderGoalItem = (goal: any, idx: number) => {
    let daysText = '未设置目标日期'
    let badgeClass = 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
    
    if (goal.target_date) {
      const targetDate = parseISO(goal.target_date)
      const diff = differenceInDays(targetDate, startOfDay(new Date()))
      if (diff < 0) {
        daysText = `已逾期 ${Math.abs(diff)} 天`
        badgeClass = 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
      } else if (diff === 0) {
        daysText = '就是今天'
        badgeClass = 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
      } else {
        daysText = `还有 ${diff} 天`
        badgeClass = 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-brand'
      }
    }

    return (
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} key={goal.id} className="p-4 bg-bg-secondary backdrop-blur-sm rounded-xl border border-white/20 dark:border-white/5 hover:border-[#D6D3CD] dark:hover:border-[#4A4844] transition-all duration-300 flex items-center justify-between">
        <div className="min-w-0 flex-1 mr-3">
          <span className="text-sm font-semibold text-text-primary truncate block">{goal.title}</span>
          {goal.target_date && <span className="text-xs text-text-secondary mt-1 block">{format(parseISO(goal.target_date), 'yyyy年M月d日')}</span>}
        </div>
        <span className={`text-[11px] font-bold shrink-0 px-2.5 py-1 rounded-md ${badgeClass}`}>{daysText}</span>
      </motion.div>
    )
  }

  const toggleTab = (tab: typeof activeTab) => {
    setActiveTab(activeTab === tab ? 'overview' : tab)
  }

  return (
    <motion.div 
      className="max-w-6xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={itemVariants} className="mb-8 md:mb-10">
        <h1 className="text-2xl md:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 tracking-tight">
          {format(new Date(), 'yyyy年M月d日 EEEE', { locale: zhCN })}
        </h1>
        <p className="text-text-secondary mt-2 text-sm md:text-base font-medium">欢迎回来，点击下方卡片查看详情</p>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-8 md:mb-10">
        <StatCard icon={CheckSquare} label="待办任务" value={stats.pendingTasks.length} gradient="from-blue-500 to-cyan-400" shadow="shadow-blue-500/20" isActive={activeTab === 'pending'} onClick={() => toggleTab('pending')} />
        <StatCard icon={Calendar} label="今日任务" value={stats.todayTasks.length} gradient="from-purple-500 to-pink-500" shadow="shadow-purple-500/20" isActive={activeTab === 'today'} onClick={() => toggleTab('today')} />
        <StatCard icon={Target} label="进行中目标" value={stats.activeGoals.length} gradient="from-green-500 to-emerald-400" shadow="shadow-green-500/20" isActive={activeTab === 'goals'} onClick={() => toggleTab('goals')} />
        <StatCard icon={Clock} label="今日时间块" value={stats.todayBlocks.length} gradient="from-amber-500 to-orange-400" shadow="shadow-amber-500/20" isActive={activeTab === 'blocks'} onClick={() => toggleTab('blocks')} />
      </motion.div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
            <div className="glass rounded-2xl p-5 md:p-7 card-hover">
              <h2 className="text-lg font-bold text-text-primary mb-4 md:mb-5 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <AlertCircle size={18} className="text-amber-600 dark:text-amber-400" />
                </div>
                即将到来的任务
              </h2>
              {stats.upcomingTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-500"><CheckSquare size={32} className="mb-3 opacity-20" /><p className="text-sm">暂无即将到来的任务</p></div>
              ) : (
                <div className="space-y-3">{stats.upcomingTasks.map(renderTaskItem)}</div>
              )}
            </div>

            <div className="glass rounded-2xl p-5 md:p-7 card-hover">
              <h2 className="text-lg font-bold text-text-primary mb-4 md:mb-5 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <TrendingUp size={18} className="text-green-600 dark:text-green-400" />
                </div>
                目标总览
              </h2>
              {stats.activeGoals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-500"><Target size={32} className="mb-3 opacity-20" /><p className="text-sm">暂无进行中的目标</p></div>
              ) : (
                <div className="space-y-4">
                  {stats.activeGoals.slice(0, 5).map(renderGoalItem)}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'pending' && (
          <motion.div key="pending" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="glass rounded-2xl p-5 md:p-7">
            <h2 className="text-lg font-bold text-text-primary mb-5 flex items-center gap-2.5"><ListChecks size={20} className="text-blue-500" /> 待办任务列表</h2>
            {stats.pendingTasks.length === 0 ? <p className="text-sm text-gray-500 text-center py-8">棒极了！您没有待办任务。</p> : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{stats.pendingTasks.map(renderTaskItem)}</div>}
          </motion.div>
        )}

        {activeTab === 'today' && (
          <motion.div key="today" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="glass rounded-2xl p-5 md:p-7">
            <h2 className="text-lg font-bold text-text-primary mb-5 flex items-center gap-2.5"><Calendar size={20} className="text-purple-500" /> 今日任务列表</h2>
            {stats.todayTasks.length === 0 ? <p className="text-sm text-gray-500 text-center py-8">今天暂未安排任务。</p> : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{stats.todayTasks.map(renderTaskItem)}</div>}
          </motion.div>
        )}

        {activeTab === 'goals' && (
          <motion.div key="goals" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="glass rounded-2xl p-5 md:p-7">
            <h2 className="text-lg font-bold text-text-primary mb-5 flex items-center gap-2.5"><Target size={20} className="text-green-500" /> 进行中目标</h2>
            {stats.activeGoals.length === 0 ? <p className="text-sm text-gray-500 text-center py-8">暂无进行中的目标。</p> : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stats.activeGoals.map(renderGoalItem)}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'blocks' && (
          <motion.div key="blocks" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="glass rounded-2xl p-5 md:p-7">
            <h2 className="text-lg font-bold text-text-primary mb-5 flex items-center gap-2.5"><Clock size={20} className="text-amber-500" /> 今日时间块</h2>
              {stats.todayBlocks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-500"><Clock size={32} className="mb-3 opacity-20" /><p className="text-sm">今日无时间块规划</p></div>
              ) : (
                <div className="space-y-3">
                  {stats.todayBlocks.sort((a: any, b: any) => a.start_time.localeCompare(b.start_time)).map((block: any, i: number) => (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} key={block.id} className="p-4 bg-bg-secondary backdrop-blur-sm rounded-xl border border-white/20 dark:border-white/5 hover:border-[#D6D3CD] dark:hover:border-[#4A4844] transition-all duration-300 flex flex-col gap-2 border-l-4" style={{ borderLeftColor: block.color || '#6366f1' }}>
                    <div className="flex items-center justify-between"><span className="text-sm font-bold text-text-primary">{block.title}</span><span className="text-xs font-medium text-text-secondary bg-white dark:bg-gray-900/50 px-2 py-1 rounded-md shadow-sm">{block.start_time} - {block.end_time}</span></div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function StatCard({ icon: Icon, label, value, gradient, isActive, onClick }: { icon: any; label: string; value: number; gradient: string; shadow: string; isActive: boolean; onClick: () => void }) {
  return (
    <div onClick={onClick} className={`cursor-pointer glass rounded-2xl p-4 md:p-6 card-hover relative overflow-hidden group transition-all duration-300 ${isActive ? 'ring-1 ring-[#D6D3CD] dark:ring-[#4A4844] bg-[#F5F4EF] dark:bg-[#2A2927]' : ''}`}>
      <div className="flex flex-col justify-between h-full relative z-10">
        <div className="flex items-start justify-between mb-2">
          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br ${gradient} shadow-none flex items-center justify-center transform group-hover:rotate-6 group-hover:scale-110 transition-all duration-300`}>
            <Icon size={20} className="text-white" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-3xl md:text-4xl font-black font-serif text-text-primary tracking-tight">{value}</p>
          <p className="text-xs md:text-sm font-medium text-text-secondary mt-1">{label}</p>
        </div>
      </div>
    </div>
  )
}
