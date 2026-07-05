import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { useNotificationsStore, type NotificationType } from '../store/useNotificationsStore'

const iconMap: Record<NotificationType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}

export function Notifications() {
  const { notifications, dismiss } = useNotificationsStore()

  if (notifications.length === 0) return null

  return (
    <div className="notifications" aria-live="polite" aria-label="Notifications">
      {notifications.map((notification) => {
        const Icon = iconMap[notification.type]

        return (
          <div className={`notification notification-${notification.type}`} key={notification.id}>
            <Icon size={18} />
            <span>{notification.message}</span>
            <button type="button" onClick={() => dismiss(notification.id)} aria-label="Dismiss notification">
              <X size={16} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
