import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { createPortal } from 'react-dom'

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = '删除',
  cancelText = '取消',
  onConfirm,
  onCancel,
  isDestructive = true
}: ConfirmDialogProps) {
  const dialogContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-xl z-[100] overflow-hidden border border-gray-100 dark:border-white/10"
          >
            <div className="p-5 md:p-6">
              <div className="flex items-start gap-4">
                <div className={`p-2.5 rounded-2xl shrink-0 ${isDestructive ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'}`}>
                  <AlertTriangle size={24} />
                </div>
                <div className="flex-1 mt-0.5">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">{message}</p>
                </div>
              </div>
            </div>
            
            <div className="px-5 py-4 bg-gray-50/80 dark:bg-black/20 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-white/5">
              <button
                onClick={onCancel}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors btn-press"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-sm btn-press ${
                  isDestructive 
                    ? 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 shadow-red-500/20' 
                    : 'bg-brand hover:bg-brand/90 shadow-brand/20'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  if (typeof document !== 'undefined') {
    return createPortal(dialogContent, document.body)
  }
  return null
}
