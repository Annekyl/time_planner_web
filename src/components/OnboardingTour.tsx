import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import { useAuth } from '../hooks/useAuth'

export default function OnboardingTour() {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // 确保用户已登录
    if (!user) return

    const storageKey = `has_seen_driver_tour_${user.id}`
    const hasSeenTour = localStorage.getItem(storageKey)

    if (!hasSeenTour) {
      // 稍微延迟一下等待 DOM 渲染
      const timer = setTimeout(() => {
        const driverObj = driver({
          showProgress: true,
          allowClose: true,
          nextBtnText: '下一步 ➔',
          prevBtnText: '⬅ 上一步',
          doneBtnText: '开启旅程',
          progressText: '{{current}} / {{total}}',
          popoverClass: 'dark:bg-bg-secondary dark:text-text-primary rounded-2xl border-none shadow-2xl',
          onDestroyed: () => {
            // 记录已看过
            localStorage.setItem(storageKey, 'true')
          },
          steps: [
            {
              popover: {
                title: '✨ 欢迎来到时间规划助手',
                description: '接下来，我们将带您快速了解各个功能模块，帮助您高效规划时间。准备好了吗？'
              }
            },
            {
              element: '#tour-nav-dashboard',
              popover: {
                title: '📊 仪表盘',
                description: '在这里，您可以一览今日的核心数据、进度总览，对全局了然于胸。',
                side: 'right',
                align: 'start'
              }
            },
            {
              element: '#tour-nav-planner',
              popover: {
                title: '📝 每日规划',
                description: '聚焦于今天！您可以在这里分配时间块，把一天的时间安排得明明白白。',
                side: 'right',
                align: 'start'
              }
            },
            {
              element: '#tour-nav-calendar',
              popover: {
                title: '📅 日历视图',
                description: '通过高级拖拽，在周视图或日视图中直观地移动和调整您的日程。',
                side: 'right',
                align: 'start'
              }
            },
            {
              element: '#tour-nav-tasks',
              popover: {
                title: '✅ 任务管理',
                description: '记录下所有待办事项，并为它们设置优先级和截止日期。',
                side: 'right',
                align: 'start'
              }
            },
            {
              element: '#tour-nav-goals',
              popover: {
                title: '🎯 目标追踪',
                description: '设定长期目标。每个小目标的完成，都是您向梦想迈进的一大步！',
                side: 'right',
                align: 'start'
              }
            },
            {
              element: '#tour-nav-stats',
              popover: {
                title: '📈 数据统计',
                description: '丰富的统计图表，复盘您的任务完成率和历史趋势。',
                side: 'right',
                align: 'start'
              }
            },
            {
              element: '#tour-pomodoro',
              popover: {
                title: '🍅 番茄钟 & 白噪音',
                description: '需要专注？点开这里开启番茄钟，还可以播放白噪音（如茉莉花），帮您进入心流状态。',
                side: 'left',
                align: 'end'
              }
            },
            {
              element: '#tour-settings',
              popover: {
                title: '⚙️ 偏好设置',
                description: '在这里，您可以自定义界面主题、时间块的默认长度以及您的作息时间段。',
                side: 'right',
                align: 'end'
              }
            },
            {
              popover: {
                title: '🚀 准备就绪！',
                description: '提示：您可以随时按下快捷键 Ctrl + K 唤起全局命令面板。现在，开始您的时间管理之旅吧！'
              }
            }
          ]
        })

        // 启动引导
        driverObj.drive()
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [user, navigate])

  return null // 这个组件不渲染任何可见内容
}
