import type { DocumentStatus } from '../types/document'
import { useI18n } from '../i18n'

const statusClassMap: Record<DocumentStatus, string> = {
  Draft: 'draft',
  Review: 'review',
  Approved: 'approved',
  Archived: 'archived',
}

export function StatusBadge({ status }: { status: DocumentStatus }) {
  const { t } = useI18n()
  const label = t(`status.${status}`)

  return (
    <span
      className={`status-badge status-badge-${statusClassMap[status]}`}
      title={label}
      aria-label={label}
    />
  )
}
