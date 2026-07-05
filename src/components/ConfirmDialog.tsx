import { AlertTriangle, X } from 'lucide-react'
import { useI18n } from '../i18n'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  busy,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useI18n()

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <button className="icon-button close-button" type="button" onClick={onCancel} aria-label={t('form.close')}>
          <X size={18} />
        </button>
        <div className="dialog-icon">
          <AlertTriangle size={24} />
        </div>
        <h2 id="confirm-title">{title}</h2>
        <p>{message}</p>
        <div className="modal-actions">
          <button className="secondary-button" type="button" onClick={onCancel} disabled={busy}>
            {t('confirm.cancel')}
          </button>
          <button className="danger-button" type="button" onClick={onConfirm} disabled={busy}>
            {busy ? t('confirm.deleting') : (confirmLabel ?? t('confirm.default'))}
          </button>
        </div>
      </section>
    </div>
  )
}
