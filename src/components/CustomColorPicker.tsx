import { useState, useRef } from 'react'
import { Check, Palette } from 'lucide-react'
import { PortalPopover } from './PortalPopover'

const PRESET_COLORS = [
  '#f87171', '#fb923c', '#fbbf24', '#a3e635', '#4ade80', '#34d399', 
  '#2dd4bf', '#38bdf8', '#60a5fa', '#818cf8', '#a78bfa', '#c084fc', 
  '#e879f9', '#f472b6', '#fb7185', '#94a3b8'
]

interface CustomColorPickerProps {
  value: string
  onChange: (color: string) => void
  className?: string
  style?: React.CSSProperties
  variant?: 'square' | 'input'
}

export default function CustomColorPicker({ value, onChange, className = '', style, variant = 'input' }: CustomColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLButtonElement>(null)

  return (
    <>
      <button
        ref={containerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={
          variant === 'square'
            ? `flex items-center justify-center w-full h-full min-w-[36px] min-h-[36px] rounded-lg border border-black/10 dark:border-white/10 shadow-sm transition-transform hover:scale-105 outline-none focus:ring-2 focus:ring-brand focus:border-brand ${className}`
            : `w-full flex items-center gap-2 px-3 py-2 bg-bg-secondary text-text-primary border border-border-default rounded-xl outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-all duration-200 text-left ${className}`
        }
        style={variant === 'square' ? { backgroundColor: value || '#3b82f6', ...style } : style}
      >
        {variant === 'square' ? (
          <Palette size={16} className="text-white mix-blend-difference opacity-70" />
        ) : (
          <>
            <div className="w-4 h-4 rounded-full shadow-sm shrink-0" style={{ backgroundColor: value || '#3b82f6' }} />
            <span className="truncate text-sm font-medium flex-1 uppercase">
              {value || '#3b82f6'}
            </span>
          </>
        )}
      </button>

      <PortalPopover isOpen={isOpen} onClose={() => setIsOpen(false)} triggerRef={containerRef} width={212} height={160}>
        <div className="glass bg-bg-secondary/95 backdrop-blur-xl rounded-2xl border border-border-subtle shadow-xl p-3">
          <div className="grid grid-cols-4 gap-2 mb-3">
            {PRESET_COLORS.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => {
                  onChange(color)
                  setIsOpen(false)
                }}
                className="w-10 h-10 rounded-full shadow-sm flex items-center justify-center hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400"
                style={{ backgroundColor: color }}
              >
                {value === color && <Check size={16} className="text-white mix-blend-difference" />}
              </button>
            ))}
          </div>
          <div className="pt-2 border-t border-border-subtle flex items-center gap-2">
            <span className="text-xs text-text-secondary shrink-0">自定义</span>
            <input 
              type="color" 
              value={value || '#000000'}
              onChange={e => onChange(e.target.value)}
              className="w-full h-8 p-0 rounded border-0 cursor-pointer"
            />
          </div>
        </div>
      </PortalPopover>
    </>
  )
}
