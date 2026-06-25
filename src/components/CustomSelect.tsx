import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check } from 'lucide-react'

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
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find(o => o.value === value)

  return (
    <div className="relative inline-block w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 bg-bg-secondary text-text-primary border border-border-default rounded-xl outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-all duration-200 text-left ${className}`}
      >
        <span className="truncate text-sm font-medium">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown size={16} className={`text-text-secondary transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -10, scaleY: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{ transformOrigin: 'top' }}
            className="absolute z-50 w-full mt-1.5 glass bg-bg-secondary/90 backdrop-blur-md rounded-xl border border-border-subtle shadow-xl overflow-hidden max-h-60 overflow-y-auto"
          >
            <div className="p-1 space-y-0.5">
              {options.map((option) => {
                const isSelected = option.value === value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value)
                      setIsOpen(false)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-200 text-left ${
                      isSelected 
                        ? 'bg-brand/10 text-brand font-bold' 
                        : 'text-text-secondary hover:bg-black/5 dark:hover:bg-white/5 hover:text-text-primary'
                    }`}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected && <Check size={16} className="shrink-0 text-brand" />}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
