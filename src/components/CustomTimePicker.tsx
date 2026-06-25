import { useState, useRef, useEffect } from 'react'
import { Clock } from 'lucide-react'
import { PortalPopover } from './PortalPopover'

interface CustomTimePickerProps {
  value: string
  onChange: (time: string) => void
  className?: string
  placeholder?: string
}

export default function CustomTimePicker({ value, onChange, className = '', placeholder = '选择时间' }: CustomTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLButtonElement>(null)
  
  const initialHour = value ? value.split(':')[0] : '09'
  const initialMinute = value ? value.split(':')[1] : '00'
  const [hour, setHour] = useState(initialHour)
  const [minute, setMinute] = useState(initialMinute)

  useEffect(() => {
    if (value) {
      setHour(value.split(':')[0] || '09')
      setMinute(value.split(':')[1] || '00')
    }
  }, [value])

  // Removing the click-outside useEffect since PortalPopover handles it


  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

  const handleHourSelect = (h: string) => {
    setHour(h)
    onChange(`${h}:${minute}`)
  }

  const handleMinuteSelect = (m: string) => {
    setMinute(m)
    onChange(`${hour}:${m}`)
  }

  const ScrollColumn = ({ items, value, onSelect }: { items: string[], value: string, onSelect: (val: string) => void }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    
    const setsCount = 30;
    const middleSet = Math.floor(setsCount / 2);
    const displayItems = Array.from({ length: setsCount }, () => items).flat();

    useEffect(() => {
      if (scrollRef.current) {
        const index = Math.max(0, items.indexOf(value));
        const targetIndex = middleSet * items.length + index;
        const el = scrollRef.current.children[targetIndex + 1] as HTMLElement;
        if (el) {
          scrollRef.current.scrollTop = el.offsetTop - scrollRef.current.clientHeight / 2 + el.clientHeight / 2;
        }
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <div 
        ref={scrollRef} 
        className="flex-1 overflow-y-auto scrollbar-hide snap-y snap-mandatory"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="py-[84px]" />
        {displayItems.map((item, i) => {
          const isSelected = item === value;
          return (
            <button
              key={`${item}-${i}`}
              type="button"
              onClick={() => {
                onSelect(item);
                const el = scrollRef.current?.children[i + 1] as HTMLElement;
                if (el && scrollRef.current) {
                   scrollRef.current.scrollTo({ top: el.offsetTop - scrollRef.current.clientHeight / 2 + el.clientHeight / 2, behavior: 'smooth' });
                }
              }}
              className={`w-full h-8 flex items-center justify-center text-sm rounded-lg transition-colors snap-center ${
                isSelected
                  ? 'bg-brand text-white font-bold shadow-sm' 
                  : 'text-text-secondary hover:bg-black/5 dark:hover:bg-white/5 hover:text-text-primary'
              }`}
            >
              {item}
            </button>
          )
        })}
        <div className="py-[84px]" />
      </div>
    )
  }

  return (
    <>
      <button
        ref={containerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-2 px-3 py-2 bg-bg-secondary text-text-primary border border-border-default rounded-xl outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-all duration-200 text-left ${className}`}
      >
        <Clock size={16} className="text-text-secondary shrink-0" />
        <span className="truncate text-sm font-medium flex-1">
          {value || <span className="text-text-secondary">{placeholder}</span>}
        </span>
      </button>

      <PortalPopover 
        isOpen={isOpen} 
        onClose={() => {
          onChange(`${hour}:${minute}`)
          setIsOpen(false)
        }} 
        triggerRef={containerRef} 
        width={140} 
        height={200}
      >
        <div className="glass bg-bg-secondary/95 backdrop-blur-xl rounded-2xl border border-border-subtle shadow-xl overflow-hidden p-2 flex gap-2 h-48 min-w-[140px]">
          {/* Hours */}
          <div className="flex-1 border-r border-border-subtle pr-1 flex flex-col">
            <ScrollColumn items={hours} value={hour} onSelect={handleHourSelect} />
          </div>
          {/* Minutes */}
          <div className="flex-1 pl-1 flex flex-col">
            <ScrollColumn items={minutes} value={minute} onSelect={handleMinuteSelect} />
          </div>
        </div>
      </PortalPopover>
    </>
  )
}
