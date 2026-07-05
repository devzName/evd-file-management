import { create } from 'zustand'

export type NotificationType = 'success' | 'error' | 'info'

export interface AppNotification {
  id: string
  type: NotificationType
  message: string
}

interface NotificationsState {
  notifications: AppNotification[]
  notify: (type: NotificationType, message: string) => void
  dismiss: (id: string) => void
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  notifications: [],

  notify: (type, message) => {
    const id = crypto.randomUUID()
    set((state) => ({
      notifications: [...state.notifications, { id, type, message }],
    }))

    window.setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((notification) => notification.id !== id),
      }))
    }, 3600)
  },

  dismiss: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((notification) => notification.id !== id),
    }))
  },
}))
