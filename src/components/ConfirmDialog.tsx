import { AlertTriangle } from 'lucide-react'
import { BaseModal } from './BaseModal'

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
  
  const footer = (
    <>
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
    </>
  )

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onCancel}
      hideHeader
      footer={footer}
      maxWidth="max-w-sm"
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
    </BaseModal>
  )
}
