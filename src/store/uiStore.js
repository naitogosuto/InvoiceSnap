import { create } from 'zustand'

export const useUIStore = create((set) => ({
  sidebarOpen: true,
  toasts: [],
  modal: null,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  /**
   * Show a toast notification
   */
  addToast: (message, type = 'info', duration = 4000) => {
    const id = Date.now().toString()
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }))

    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }))
      }, duration)
    }

    return id
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }))
  },

  openModal: (component, props = {}) => {
    set({ modal: { component, props } })
  },

  closeModal: () => {
    set({ modal: null })
  },
}))
