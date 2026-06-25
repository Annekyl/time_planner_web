import { X, LayoutDashboard, CalendarDays, Calendar, CheckSquare, Target, Timer } from 'lucide-react'
import { BaseModal } from './BaseModal'

interface UserGuideModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function UserGuideModal({ isOpen, onClose }: UserGuideModalProps) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      hideHeader
      maxWidth="max-w-2xl"
      zIndex="z-[200]"
    >
      <div className="p-6 md:p-8 relative flex flex-col h-full">
        <button onClick={onClose} className="absolute top-5 right-5 text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5"><X size={24} /></button>
        
        <div className="text-center mb-6 shrink-0">
          <h2 className="text-2xl md:text-3xl font-bold font-serif text-brand dark:text-brand mb-2">欢迎使用时间规划</h2>
          <p className="text-sm text-text-secondary">只需几分钟，了解如何高效规划您的一天</p>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
          <GuideItem 
            icon={LayoutDashboard} 
            title="1. 仪表盘 (Dashboard)" 
            desc="纵览全局。在这里您可以一目了然地看到今天的规划进度、待办任务，以及最近的长期目标。它是您每天开始的地方。" 
          />
          <GuideItem 
            icon={CalendarDays} 
            title="2. 每日规划 (Daily Planner)" 
            desc="精细规划您的一天。点击右上角的“+”来添加时间块，或者点击日历图标从已有的“任务”中选择并分配到上午、下午或晚上。您可以打钩完成它们。" 
          />
          <GuideItem 
            icon={Calendar} 
            title="3. 日历视图 (Calendar)" 
            desc="提供月视图和周视图。双击空白时间槽可以快速创建时间块。所有在“每日规划”中创建的时间块也会在这里完美同步展示。" 
          />
          <GuideItem 
            icon={CheckSquare} 
            title="4. 任务管理 (Tasks)" 
            desc="您的待办事项清单。对于那些暂时没有特定时间点，但必须在某天完成的事情，可以记录在这里，并设置优先级。" 
          />
          <GuideItem 
            icon={Target} 
            title="5. 目标追踪 (Goals)" 
            desc="放眼未来。建立长期目标（如读一本书、完成一个大项目），并更新进度条，保持对长期愿景的关注。" 
          />
          <GuideItem 
            icon={Timer} 
            title="6. 番茄钟 (Pomodoro)" 
            desc="屏幕右下角有一个可拖拽的悬浮番茄钟。点击展开后，您可以设置专注时间，甚至选择下雨、海浪或咖啡馆的白噪音，助您深度工作。" 
          />
        </div>
        
        <div className="mt-8 pt-4 border-t border-border-subtle shrink-0">
          <button onClick={onClose} className="w-full py-3 bg-brand text-white font-bold rounded-xl hover:bg-brand-hover transition-colors shadow-lg shadow-indigo-500/30 btn-press">
            我知道了，开始探索！
          </button>
        </div>
      </div>
    </BaseModal>
  )
}

function GuideItem({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="flex gap-4 p-4 rounded-2xl bg-bg-secondary border border-border-default hover:bg-bg-tertiary transition-colors">
      <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0 text-brand dark:text-brand">
        <Icon size={24} />
      </div>
      <div>
        <h3 className="font-bold text-text-primary text-base mb-1">{title}</h3>
        <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}
