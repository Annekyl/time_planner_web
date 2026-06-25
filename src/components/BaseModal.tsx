import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'

export interface BaseModalProps {
  isOpen: boolean
  onClose?: () => void
  title?: string | React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  maxWidth?: string
  hideHeader?: boolean
  closeOnClickOutside?: boolean
  zIndex?: string
}

export function BaseModal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer, 
  maxWidth = 'max-w-md',
  hideHeader = false,
  closeOnClickOutside = true,
  zIndex = 'z-[100]'
}: BaseModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const content = (
    <AnimatePresence>
      {isOpen && (
        <div 
          className={`fixed inset-0 ${zIndex} flex items-start md:items-center justify-center p-4 pt-16 md:pt-4 bg-black/40 backdrop-blur-sm`}
          onClick={closeOnClickOutside ? onClose : undefined}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className={`w-full ${maxWidth} bg-bg-primary rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl border border-border-default flex flex-col max-h-[85dvh]`}
          >
            {!hideHeader && (
              <div className="p-4 md:p-6 border-b border-border-subtle flex items-center justify-between shrink-0">
                <h3 className="font-bold text-text-primary text-lg md:text-xl">{title}</h3>
                {onClose && (
                  <button 
                    onClick={onClose}
                    className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors text-text-secondary hover:text-text-primary"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            )}
            
            <div className={`overflow-y-auto min-h-0 ${hideHeader ? '' : 'p-4 md:p-6'}`}>
              {children}
            </div>
            
            {footer && (
              <div className="p-4 md:p-6 border-t border-border-subtle bg-bg-secondary shrink-0 flex gap-3 justify-end">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )

  if (typeof document !== 'undefined') {
    return createPortal(content, document.body)
  }
  return null
}
