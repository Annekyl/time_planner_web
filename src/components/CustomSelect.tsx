import { useState, useRef } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { PortalPopover } from './PortalPopover'

export interface Option {
  label: string
  value: string | number
}

interface CustomSelectProps {
  value: string | number
  onChange: (value: any) => void
  options: Option[]
  className?: string
  placeholder?: string
}

export default function CustomSelect({ value, onChange, options, className = '', placeholder = '请选择' }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLButtonElement>(null)

  const selectedOption = options.find(o => o.value === value)

  return (
    <>
      <button
        ref={containerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 bg-bg-secondary text-text-primary border border-border-default rounded-xl outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-all duration-200 text-left ${className}`}
      >
        <span className="truncate text-sm font-medium flex-1">
          {selectedOption ? selectedOption.label : <span className="text-text-secondary">{placeholder}</span>}
        </span>
        <ChevronDown size={16} className={`text-text-secondary shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <PortalPopover isOpen={isOpen} onClose={() => setIsOpen(false)} triggerRef={containerRef}>
        <div className="glass bg-bg-secondary/90 backdrop-blur-md rounded-xl border border-border-subtle shadow-xl overflow-hidden max-h-60 overflow-y-auto">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-sm text-left transition-colors duration-150 ${
                  isSelected 
                    ? 'bg-brand/10 text-brand font-medium' 
                    : 'text-text-primary hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && <Check size={16} className="text-brand shrink-0 ml-2" />}
              </button>
            )
          })}
        </div>
      </PortalPopover>
    </>
  )
}
