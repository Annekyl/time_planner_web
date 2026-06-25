import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Settings } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useSettings } from '../hooks/useSettings'

export default function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useAuth()
  const { settings, updateSettings, loading } = useSettings(user?.id)

  const [morning, setMorning] = useState('06:00')
  const [morningEnd, setMorningEnd] = useState('12:00')
  const [afternoon, setAfternoon] = useState('12:00')
  const [afternoonEnd, setAfternoonEnd] = useState('18:00')
  const [evening, setEvening] = useState('18:00')
  const [eveningEnd, setEveningEnd] = useState('23:59')
  const [hourHeight, setHourHeight] = useState(48)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (settings) {
      setMorning(settings.morning_start)
      setMorningEnd(settings.morning_end)
      setAfternoon(settings.afternoon_start)
      setAfternoonEnd(settings.afternoon_end)
      setEvening(settings.evening_start)
      setEveningEnd(settings.evening_end)
      setHourHeight(settings.hour_height)
    }
  }, [settings])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    await updateSettings({
      morning_start: morning,
      morning_end: morningEnd,
      afternoon_start: afternoon,
      afternoon_end: afternoonEnd,
      evening_start: evening,
      evening_end: eveningEnd,
      hour_height: hourHeight
    })
    setIsSaving(false)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }} 
            className="glass w-full max-w-md p-5 md:p-6 relative max-h-[85dvh] overflow-y-auto" 
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"><X size={20} /></button>
            <div className="flex items-center gap-2 mb-6">
              <Settings className="text-text-primary" size={24} />
              <h3 className="text-lg font-bold font-serif text-text-primary">全局偏好设置</h3>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin"></div></div>
            ) : (
              <form onSubmit={handleSave} className="space-y-5">
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-text-secondary border-b border-black/5 dark:border-white/5 pb-1">时段划分</h4>
                  <div className="grid grid-cols-[auto_1fr_1fr] gap-2 items-center">
                    <label className="text-sm font-medium text-text-primary mr-2">上午时间</label>
                    <input type="time" value={morning} onChange={e => setMorning(e.target.value)} className="px-2 py-1.5 border border-border-default bg-transparent text-text-primary rounded-lg focus:border-brand outline-none text-sm" required />
                    <input type="time" value={morningEnd} onChange={e => setMorningEnd(e.target.value)} className="px-2 py-1.5 border border-border-default bg-transparent text-text-primary rounded-lg focus:border-brand outline-none text-sm" required />
                  </div>
                  <div className="grid grid-cols-[auto_1fr_1fr] gap-2 items-center">
                    <label className="text-sm font-medium text-text-primary mr-2">下午时间</label>
                    <input type="time" value={afternoon} onChange={e => setAfternoon(e.target.value)} className="px-2 py-1.5 border border-border-default bg-transparent text-text-primary rounded-lg focus:border-brand outline-none text-sm" required />
                    <input type="time" value={afternoonEnd} onChange={e => setAfternoonEnd(e.target.value)} className="px-2 py-1.5 border border-border-default bg-transparent text-text-primary rounded-lg focus:border-brand outline-none text-sm" required />
                  </div>
                  <div className="grid grid-cols-[auto_1fr_1fr] gap-2 items-center">
                    <label className="text-sm font-medium text-text-primary mr-2">晚上时间</label>
                    <input type="time" value={evening} onChange={e => setEvening(e.target.value)} className="px-2 py-1.5 border border-border-default bg-transparent text-text-primary rounded-lg focus:border-brand outline-none text-sm" required />
                    <input type="time" value={eveningEnd} onChange={e => setEveningEnd(e.target.value)} className="px-2 py-1.5 border border-border-default bg-transparent text-text-primary rounded-lg focus:border-brand outline-none text-sm" required />
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">这些设置将决定每日规划页的时段划分边界。</p>
                </div>

                <div className="space-y-3 pt-2">
                  <h4 className="text-sm font-bold text-text-secondary border-b border-black/5 dark:border-white/5 pb-1">界面显示</h4>
                  <div className="grid grid-cols-2 gap-4 items-center">
                    <label className="text-sm font-medium text-text-primary">日历时间块大小</label>
                    <select value={hourHeight} onChange={e => setHourHeight(Number(e.target.value))} className="px-3 py-2 border border-border-default bg-transparent text-text-primary rounded-lg focus:border-brand outline-none text-sm">
                      <option value={32}>紧凑 (32px/小时)</option>
                      <option value={48}>标准 (48px/小时)</option>
                      <option value={64}>宽松 (64px/小时)</option>
                    </select>
                  </div>
                </div>

                <button type="submit" disabled={isSaving} className="w-full mt-4 py-2.5 rounded-lg text-bg-primary font-medium btn-press bg-text-primary dark:bg-bg-primary disabled:opacity-50">
                  {isSaving ? '保存中...' : '保存设置'}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
