import { useMemo } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useTasks } from '../hooks/useTasks'
import { useGoals } from '../hooks/useGoals'
import { useTimeBlocks } from '../hooks/useTimeBlocks'
import { BarChart3, TrendingUp, CheckCircle, Clock, Target } from 'lucide-react'
import { format, subDays, parseISO, eachDayOfInterval } from 'date-fns'
import { motion, type Variants } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

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
    <motion.div 
      className="max-w-5xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.h1 variants={itemVariants} className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4 md:mb-6">数据统计</motion.h1>
      <motion.div variants={containerVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 mb-6 md:mb-8">
        <StatCard icon={CheckCircle} label="已完成" value={stats.completedTasks} color="from-green-400 to-green-600" />
        <StatCard icon={Clock} label="进行中" value={stats.inProgressTasks} color="from-blue-400 to-blue-600" />
        <StatCard icon={BarChart3} label="完成率" value={`${stats.completionRate}%`} color="from-purple-400 to-purple-600" />
        <StatCard icon={Target} label="活跃目标" value={stats.activeGoals} color="from-amber-400 to-orange-500" />
      </motion.div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
        <motion.div variants={itemVariants} className="glass rounded-3xl p-5 md:p-7 shadow-sm border-white/20 card-hover">
          <h2 className="text-base md:text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2"><TrendingUp size={20} className="text-indigo-500" />近7天任务完成趋势</h2>
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
          <h2 className="text-base md:text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2"><BarChart3 size={20} className="text-purple-500" />分类统计</h2>
          {stats.categoryStats.length === 0 ? <p className="text-gray-400 dark:text-gray-500 text-sm font-medium mt-10 text-center">暂无分类数据</p> : (
            <div className="h-48 md:h-64 mt-4 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.categoryStats}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                    stroke="none"
                  >
                    {stats.categoryStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#6366f1'} />
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
          <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4 text-sm md:text-base border-b border-black/5 dark:border-white/5 pb-3">任务概览</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm"><span className="font-medium text-gray-500 dark:text-gray-400">总任务数</span><span className="font-bold text-gray-800 dark:text-gray-100 bg-white/50 dark:bg-gray-800/50 px-2 py-0.5 rounded-md">{stats.totalTasks}</span></div>
            <div className="flex justify-between text-sm"><span className="font-medium text-gray-500 dark:text-gray-400">待办</span><span className="font-bold text-gray-800 dark:text-gray-100 bg-white/50 dark:bg-gray-800/50 px-2 py-0.5 rounded-md">{stats.pendingTasks}</span></div>
            <div className="flex justify-between text-sm"><span className="font-medium text-gray-500 dark:text-gray-400">已完成</span><span className="font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-md">{stats.completedTasks}</span></div>
          </div>
        </motion.div>
        <motion.div variants={itemVariants} className="glass rounded-3xl p-5 md:p-6 shadow-sm border-white/20 card-hover">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4 text-sm md:text-base border-b border-black/5 dark:border-white/5 pb-3">时间块统计</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm"><span className="font-medium text-gray-500 dark:text-gray-400">总时间块</span><span className="font-bold text-gray-800 dark:text-gray-100 bg-white/50 dark:bg-gray-800/50 px-2 py-0.5 rounded-md">{stats.totalBlocks}</span></div>
            <div className="flex justify-between text-sm"><span className="font-medium text-gray-500 dark:text-gray-400">总规划时长</span><span className="font-bold text-gray-800 dark:text-gray-100 bg-white/50 dark:bg-gray-800/50 px-2 py-0.5 rounded-md">{stats.totalBlockHours} 小时</span></div>
          </div>
        </motion.div>
        <motion.div variants={itemVariants} className="glass rounded-3xl p-5 md:p-6 shadow-sm border-white/20 card-hover">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4 text-sm md:text-base border-b border-black/5 dark:border-white/5 pb-3">目标进度</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm"><span className="font-medium text-gray-500 dark:text-gray-400">活跃目标</span><span className="font-bold text-gray-800 dark:text-gray-100 bg-white/50 dark:bg-gray-800/50 px-2 py-0.5 rounded-md">{stats.activeGoals}</span></div>
            <div className="flex justify-between text-sm"><span className="font-medium text-gray-500 dark:text-gray-400">平均进度</span><span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-md">{stats.avgGoalProgress}%</span></div>
            <div className="w-full bg-white/40 dark:bg-gray-700/40 rounded-full h-3 mt-4 overflow-hidden border border-white/20 shadow-inner"><motion.div initial={{ width: 0 }} animate={{ width: `${stats.avgGoalProgress}%` }} transition={{ duration: 1 }} className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full" /></div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <motion.div variants={itemVariants} className="glass rounded-3xl shadow-sm border-white/20 p-4 md:p-6 card-hover relative overflow-hidden group">
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full bg-gradient-to-br ${color} opacity-10 group-hover:opacity-20 transition-opacity duration-300 blur-xl`} />
      <div className="flex items-center justify-between relative z-10">
        <div><p className="text-xs md:text-sm font-bold text-gray-500 dark:text-gray-400">{label}</p><p className="text-2xl md:text-3xl font-black text-gray-800 dark:text-gray-100 mt-1 md:mt-2 tracking-tight">{value}</p></div>
        <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center transition-transform duration-500 hover:rotate-12 hover:scale-110 shadow-lg`}><Icon size={24} className="text-white" /></div>
      </div>
    </motion.div>
  )
}
