import { useState, useEffect } from 'react'
import { Settings } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useSettings } from '../hooks/useSettings'
import { BaseModal } from './BaseModal'

import CustomTimePicker from './CustomTimePicker'

export default function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useAuth()
  const { settings, updateSettings, loading } = useSettings(user?.id)

  const [morning, setMorning] = useState('06:00')
  const [morningEnd, setMorningEnd] = useState('12:00')
  const [afternoon, setAfternoon] = useState('12:00')
  const [afternoonEnd, setAfternoonEnd] = useState('18:00')
  const [evening, setEvening] = useState('18:00')
  const [eveningEnd, setEveningEnd] = useState('23:59')

  const [defaultDuration, setDefaultDuration] = useState(60)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const savedDuration = localStorage.getItem('default_block_duration')
    if (savedDuration) setDefaultDuration(Number(savedDuration))

    if (settings) {
      setMorning(settings.morning_start)
      setMorningEnd(settings.morning_end)
      setAfternoon(settings.afternoon_start)
      setAfternoonEnd(settings.afternoon_end)
      setEvening(settings.evening_start)
      setEveningEnd(settings.evening_end)
      setEveningEnd(settings.evening_end)
    }
  }, [settings])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    localStorage.setItem('default_block_duration', defaultDuration.toString())
    await updateSettings({
      morning_start: morning,
      morning_end: morningEnd,
      afternoon_start: afternoon,
      afternoon_end: afternoonEnd,
      evening_start: evening,
      evening_end: eveningEnd,
      hour_height: 80
    })
    setIsSaving(false)
    onClose()
  }

  const titleContent = (
    <div className="flex items-center gap-2">
      <Settings className="text-text-primary" size={20} />
      <span className="font-serif">全局偏好设置</span>
    </div>
  )

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={titleContent}
      maxWidth="max-w-md"
    >
      {loading ? (
        <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <form onSubmit={handleSave} className="space-y-5">
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-text-secondary border-b border-black/5 dark:border-white/5 pb-1">时段划分</h4>
            <div className="grid grid-cols-[auto_1fr_1fr] gap-2 items-center">
              <label className="text-sm font-medium text-text-primary mr-2">上午时间</label>
              <CustomTimePicker value={morning} onChange={val => setMorning(val)} />
              <CustomTimePicker value={morningEnd} onChange={val => setMorningEnd(val)} />
            </div>
            <div className="grid grid-cols-[auto_1fr_1fr] gap-2 items-center">
              <label className="text-sm font-medium text-text-primary mr-2">下午时间</label>
              <CustomTimePicker value={afternoon} onChange={val => setAfternoon(val)} />
              <CustomTimePicker value={afternoonEnd} onChange={val => setAfternoonEnd(val)} />
            </div>
            <div className="grid grid-cols-[auto_1fr_1fr] gap-2 items-center">
              <label className="text-sm font-medium text-text-primary mr-2">晚上时间</label>
              <CustomTimePicker value={evening} onChange={val => setEvening(val)} />
              <CustomTimePicker value={eveningEnd} onChange={val => setEveningEnd(val)} />
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">这些设置将决定每日规划页的时段划分边界。</p>
          </div>

          <div className="space-y-3 pt-2">
            <h4 className="text-sm font-bold text-text-secondary border-b border-black/5 dark:border-white/5 pb-1">界面显示</h4>

            <div className="grid grid-cols-2 gap-4 items-center mt-3">
              <label className="text-sm font-medium text-text-primary">默认时间块时长</label>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  min={5} 
                  max={1440} 
                  step={5}
                  value={defaultDuration} 
                  onChange={e => setDefaultDuration(Number(e.target.value))} 
                  className="w-full px-3 py-2 border border-border-default bg-transparent text-text-primary rounded-lg focus:border-brand outline-none text-sm" 
                  required 
                />
                <span className="text-sm text-text-secondary whitespace-nowrap">分钟</span>
              </div>
            </div>
          </div>

          <button type="submit" disabled={isSaving} className="w-full mt-4 py-2.5 rounded-lg text-bg-primary font-medium btn-press bg-text-primary dark:bg-bg-primary disabled:opacity-50">
            {isSaving ? '保存中...' : '保存设置'}
          </button>
        </form>
      )}
    </BaseModal>
  )
}
