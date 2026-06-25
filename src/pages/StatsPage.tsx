import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useStats } from '../hooks/useStats'
import { BarChart3, TrendingUp, CheckCircle, Clock, Target } from 'lucide-react'
import { format, parseISO, isToday, isTomorrow, differenceInDays, startOfDay } from 'date-fns'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

const PRESET_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#0ea5e9']

export default function StatsPage() {
  const { user } = useAuth()
  const { stats: statsData } = useStats(user?.id)
  const [activeTab, setActiveTab] = useState<'completed' | 'in_progress' | 'goals' | null>(null)

  const priorityLabel: Record<number, string> = { 1: '低', 2: '中', 3: '高', 4: '紧急' }
  const priorityColor: Record<number, string> = {
    1: 'bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-400',
    2: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    3: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    4: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  }

  const renderTaskItem = (task: any, idx: number) => (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} key={task.id} className="flex items-center justify-between p-3.5 bg-bg-secondary backdrop-blur-sm rounded-xl border border-white/20 dark:border-white/5 hover:border-[#D6D3CD] dark:hover:border-[#4A4844] transition-all duration-300 group">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-2.5 h-2.5 rounded-full shrink-0 shadow-sm ${task.status === 'in_progress' ? 'bg-blue-500 shadow-blue-500/50 animate-pulse' : task.status === 'completed' ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
        <span className={`text-sm font-medium truncate transition-colors ${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-text-secondary group-hover:text-brand dark:group-hover:text-indigo-400'}`}>{task.title}</span>
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
      const diff = differenceInDays(parseISO(goal.target_date), startOfDay(new Date()))
      if (diff < 0) { daysText = `已逾期 ${Math.abs(diff)} 天`; badgeClass = 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' }
      else if (diff === 0) { daysText = '就是今天'; badgeClass = 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' }
      else { daysText = `还有 ${diff} 天`; badgeClass = 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-brand' }
    }
    return (
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} key={goal.id} className="p-4 bg-bg-secondary backdrop-blur-sm rounded-xl border border-white/20 dark:border-white/5 hover:border-[#D6D3CD] dark:hover:border-[#4A4844] transition-all duration-300 flex items-center justify-between">
        <div className="min-w-0 flex-1 mr-3"><span className="text-sm font-semibold text-text-primary truncate block">{goal.title}</span>{goal.target_date && <span className="text-xs text-text-secondary mt-1 block">{format(parseISO(goal.target_date), 'yyyy年M月d日')}</span>}</div>
        <span className={`text-[11px] font-bold shrink-0 px-2.5 py-1 rounded-md ${badgeClass}`}>{daysText}</span>
      </motion.div>
    )
  }

  const toggleTab = (tab: typeof activeTab) => setActiveTab(activeTab === tab ? null : tab)

  const stats = statsData ? { ...statsData, completionRate: statsData.totalTasks > 0 ? Math.round((statsData.completedTasks / statsData.totalTasks) * 100) : 0 } : { totalTasks: 0, completedTasks: 0, pendingTasks: 0, inProgressTasks: 0, completionRate: 0, totalBlocks: 0, totalBlockHours: 0, categoryStats: [], activeGoals: 0, avgGoalProgress: 0, dailyCompletions: [], completedTasksList: [], inProgressTasksList: [], activeGoalsList: [] }

  return (
    <motion.div 
      className="max-w-5xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.h1 variants={itemVariants} className="text-xl md:text-2xl font-bold text-text-primary mb-4 md:mb-6">数据统计</motion.h1>
      <motion.div variants={containerVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 mb-6 md:mb-8">
        <StatCard icon={CheckCircle} label="已完成" value={stats.completedTasks} color="from-green-400 to-green-600" isActive={activeTab === 'completed'} onClick={() => toggleTab('completed')} />
        <StatCard icon={Clock} label="进行中" value={stats.inProgressTasks} color="from-blue-400 to-blue-600" isActive={activeTab === 'in_progress'} onClick={() => toggleTab('in_progress')} />
        <StatCard icon={BarChart3} label="完成率" value={`${stats.completionRate}%`} color="from-purple-400 to-purple-600" />
        <StatCard icon={Target} label="活跃目标" value={stats.activeGoals} color="from-amber-400 to-orange-500" isActive={activeTab === 'goals'} onClick={() => toggleTab('goals')} />
      </motion.div>

      <AnimatePresence mode="wait">
        {activeTab === 'completed' && (
          <motion.div key="completed" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="glass rounded-3xl p-5 md:p-7 mb-6 shadow-sm border-white/20">
            <h2 className="text-lg font-bold text-text-primary mb-5 flex items-center gap-2.5"><CheckCircle size={20} className="text-green-500" /> 已完成任务</h2>
            {stats.completedTasksList.length === 0 ? <p className="text-sm text-gray-500 text-center py-8">暂无已完成任务</p> : <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2">{stats.completedTasksList.map(renderTaskItem)}</div>}
          </motion.div>
        )}
        {activeTab === 'in_progress' && (
          <motion.div key="in_progress" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="glass rounded-3xl p-5 md:p-7 mb-6 shadow-sm border-white/20">
            <h2 className="text-lg font-bold text-text-primary mb-5 flex items-center gap-2.5"><Clock size={20} className="text-blue-500" /> 进行中任务</h2>
            {stats.inProgressTasksList.length === 0 ? <p className="text-sm text-gray-500 text-center py-8">暂无进行中的任务</p> : <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2">{stats.inProgressTasksList.map(renderTaskItem)}</div>}
          </motion.div>
        )}
        {activeTab === 'goals' && (
          <motion.div key="goals" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="glass rounded-3xl p-5 md:p-7 mb-6 shadow-sm border-white/20">
            <h2 className="text-lg font-bold text-text-primary mb-5 flex items-center gap-2.5"><Target size={20} className="text-amber-500" /> 活跃目标</h2>
            {stats.activeGoalsList.length === 0 ? <p className="text-sm text-gray-500 text-center py-8">暂无活跃目标</p> : <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2">{stats.activeGoalsList.map(renderGoalItem)}</div>}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
        <motion.div variants={itemVariants} className="glass rounded-3xl p-5 md:p-7 shadow-sm border-white/20 card-hover">
          <h2 className="text-base md:text-lg font-bold text-text-primary mb-4 flex items-center gap-2"><TrendingUp size={20} className="text-indigo-500" />近7天任务完成趋势</h2>
          <div className="h-48 md:h-64 mt-4 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.dailyCompletions} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(8px)' }}
                  itemStyle={{ color: '#4f46e5', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="count" name="完成任务数" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
        <motion.div variants={itemVariants} className="glass rounded-3xl p-5 md:p-7 shadow-sm border-white/20 card-hover">
          <h2 className="text-base md:text-lg font-bold text-text-primary mb-4 flex items-center gap-2"><BarChart3 size={20} className="text-purple-500" />分类统计</h2>
          {stats.categoryStats.length === 0 ? <p className="text-text-primary text-sm font-medium mt-10 text-center">暂无分类数据</p> : (
            <div className="h-48 md:h-64 mt-4 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.categoryStats} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="count" stroke="none">
                    {stats.categoryStats.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color || PRESET_COLORS[index % PRESET_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(8px)' }}
                    itemStyle={{ fontWeight: 'bold' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#6b7280' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <motion.div variants={itemVariants} className="glass rounded-3xl p-5 md:p-6 shadow-sm border-white/20 card-hover">
          <h3 className="font-bold text-text-primary mb-4 text-sm md:text-base border-b border-black/5 dark:border-white/5 pb-3">任务概览</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm"><span className="font-medium text-text-secondary">总任务数</span><span className="font-bold text-text-primary bg-bg-secondary px-2 py-0.5 rounded-md">{stats.totalTasks}</span></div>
            <div className="flex justify-between text-sm"><span className="font-medium text-text-secondary">待办</span><span className="font-bold text-text-primary bg-bg-secondary px-2 py-0.5 rounded-md">{stats.pendingTasks}</span></div>
            <div className="flex justify-between text-sm"><span className="font-medium text-text-secondary">已完成</span><span className="font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-md">{stats.completedTasks}</span></div>
          </div>
        </motion.div>
        <motion.div variants={itemVariants} className="glass rounded-3xl p-5 md:p-6 shadow-sm border-white/20 card-hover">
          <h3 className="font-bold text-text-primary mb-4 text-sm md:text-base border-b border-black/5 dark:border-white/5 pb-3">时间块统计</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm"><span className="font-medium text-text-secondary">总时间块</span><span className="font-bold text-text-primary bg-bg-secondary px-2 py-0.5 rounded-md">{stats.totalBlocks}</span></div>
            <div className="flex justify-between text-sm"><span className="font-medium text-text-secondary">总规划时长</span><span className="font-bold text-text-primary bg-bg-secondary px-2 py-0.5 rounded-md">{stats.totalBlockHours} 小时</span></div>
          </div>
        </motion.div>
        <motion.div variants={itemVariants} className="glass rounded-3xl p-5 md:p-6 shadow-sm border-white/20 card-hover">
          <h3 className="font-bold text-text-primary mb-4 text-sm md:text-base border-b border-black/5 dark:border-white/5 pb-3">目标进度</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm"><span className="font-medium text-text-secondary">活跃目标</span><span className="font-bold text-text-primary bg-bg-secondary px-2 py-0.5 rounded-md">{stats.activeGoals}</span></div>
            <div className="flex justify-between text-sm"><span className="font-medium text-text-secondary">平均进度</span><span className="font-bold text-brand dark:text-brand bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-md">{stats.avgGoalProgress}%</span></div>
            <div className="w-full bg-white/40 dark:bg-gray-700/40 rounded-full h-3 mt-4 overflow-hidden border border-white/20 shadow-inner"><motion.div initial={{ width: 0 }} animate={{ width: `${stats.avgGoalProgress}%` }} transition={{ duration: 1 }} className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full" /></div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

function StatCard({ icon: Icon, label, value, color, isActive, onClick }: { icon: any; label: string; value: string | number; color: string; isActive?: boolean; onClick?: () => void }) {
  return (
    <motion.div variants={itemVariants} onClick={onClick} className={`glass rounded-3xl border-white/20 p-4 md:p-6 card-hover relative overflow-hidden group ${onClick ? 'cursor-pointer transition-all duration-300' : ''} ${isActive ? 'ring-1 ring-[#D6D3CD] dark:ring-[#4A4844] bg-[#F5F4EF] dark:bg-[#2A2927]' : ''}`}>
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full bg-gradient-to-br ${color} opacity-10 group-hover:opacity-20 transition-opacity duration-300 blur-xl`} />
      <div className="flex items-center justify-between relative z-10">
        <div><p className="text-xs md:text-sm font-bold text-text-secondary">{label}</p><p className="text-2xl md:text-3xl font-black font-serif text-text-primary mt-1 md:mt-2 tracking-tight">{value}</p></div>
        <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center transition-transform duration-500 hover:rotate-12 hover:scale-110 shadow-none`}><Icon size={24} className="text-white" /></div>
      </div>
    </motion.div>
  )
}
