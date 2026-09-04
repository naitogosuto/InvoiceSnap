import { useEffect, useRef } from 'react'
import { useUIStore } from '@/store/uiStore'

export function Modal({ open, onClose, title, children, size = 'md' }) {
  const overlayRef = useRef(null)
  const closeModal = useUIStore((s) => s.closeModal)

  const handleClose = onClose || closeModal

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') handleClose()
    }

    if (open) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [open, handleClose])

  if (!open) return null

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === overlayRef.current) handleClose()
        }}
      />
      <div
        className={`
          relative bg-white rounded-xl shadow-xl border border-gray-200
          w-full ${sizes[size] || sizes.md} max-h-[90vh] overflow-y-auto
          animate-[fadeIn_200ms_ease-out]
        `}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
