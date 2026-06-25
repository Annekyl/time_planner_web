import { useEffect, useState, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'

interface PortalPopoverProps {
  isOpen: boolean
  triggerRef: React.RefObject<any>
  children: ReactNode
  onClose: () => void
  width?: number | string
  height?: number // Estimated height
}

export function PortalPopover({ isOpen, triggerRef, children, onClose, width, height = 300 }: PortalPopoverProps) {
  const [rect, setRect] = useState<DOMRect | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const updateRect = () => setRect(triggerRef.current!.getBoundingClientRect())
      updateRect()
      
      const handleScroll = (e: Event) => {
        // Do not update if the scroll is inside the popover itself
        if (popoverRef.current && popoverRef.current.contains(e.target as Node)) {
          return;
        }
        updateRect()
      }
      
      window.addEventListener('scroll', handleScroll, true)
      window.addEventListener('resize', handleScroll)
      
      const handleClickOutside = (e: MouseEvent) => {
        if (
          triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
          popoverRef.current && !popoverRef.current.contains(e.target as Node)
        ) {
          onClose()
        }
      }
      document.addEventListener('mousedown', handleClickOutside, true)
      
      return () => {
        window.removeEventListener('scroll', handleScroll, true)
        window.removeEventListener('resize', handleScroll)
        document.removeEventListener('mousedown', handleClickOutside, true)
      }
    }
  }, [isOpen, triggerRef, onClose])

  if (!mounted) return null

  let top = 0
  let left = 0
  let isBottomOut = false
  if (rect) {
    isBottomOut = rect.bottom + height + 8 > window.innerHeight
    top = isBottomOut ? Math.max(8, rect.top - height - 8) : rect.bottom + 8
    left = rect.left
    
    // Check right edge
    const estimatedWidth = typeof width === 'number' ? width : (typeof width === 'string' && width.includes('px') ? parseInt(width) : 280)
    if (left + estimatedWidth > window.innerWidth) {
       left = Math.max(8, window.innerWidth - estimatedWidth - 8)
    }
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && rect && (
        <div ref={popoverRef} style={{ position: 'fixed', top, left, width: width || rect.width, zIndex: 99999 }}>
          <motion.div
            initial={{ opacity: 0, y: isBottomOut ? 10 : -10, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: isBottomOut ? 10 : -10, scaleY: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{ transformOrigin: isBottomOut ? 'bottom' : 'top' }}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
