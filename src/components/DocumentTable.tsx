import { useEffect, useMemo, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Check, Pencil, RotateCcw, Trash2 } from 'lucide-react'
import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_STATUSES,
  type DocumentFormValues,
  type DocumentRecord,
  type UserRole,
} from '../types/document'
import { hasErrors, normalizeDocumentValues, validateDocument, type ValidationErrors } from '../utils/validation'
import { useI18n } from '../i18n'
import { StatusBadge } from './StatusBadge'

interface DocumentTableProps {
  documents: DocumentRecord[]
  loading: boolean
  role: UserRole
  saving: boolean
  onEdit: (document: DocumentRecord) => void
  onDelete: (document: DocumentRecord) => void
  onInlineSave: (id: string, values: DocumentFormValues) => Promise<void>
}

type DraftMap = Record<string, DocumentFormValues>
type ErrorMap = Record<string, ValidationErrors<DocumentFormValues>>

function toFormValues(document: DocumentRecord): DocumentFormValues {
  return {
    code: document.code,
    title: document.title,
    category: document.category,
    status: document.status,
    createdBy: document.createdBy,
  }
}

export function DocumentTable({
  documents,
  loading,
  role,
  saving,
  onEdit,
  onDelete,
  onInlineSave,
}: DocumentTableProps) {
  const { t } = useI18n()
  const parentRef = useRef<HTMLDivElement>(null)
  const [drafts, setDrafts] = useState<DraftMap>({})
  const [errors, setErrors] = useState<ErrorMap>({})
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    setDrafts((current) => {
      const next = { ...current }
      documents.forEach((document) => {
        next[document.id] = next[document.id] ?? toFormValues(document)
      })
      return next
    })
  }, [documents])

  const rowVirtualizer = useVirtualizer({
    count: documents.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 58,
    overscan: 10,
  })

  const virtualRows = rowVirtualizer.getVirtualItems()
  const totalSize = rowVirtualizer.getTotalSize()

  const columns = useMemo(
    () => [
      t('table.code'),
      t('table.title'),
      t('table.category'),
      t('table.status'),
      t('table.createdBy'),
      t('table.createdDate'),
      t('table.actions'),
    ],
    [t],
  )

  const updateField = (document: DocumentRecord, field: keyof DocumentFormValues, value: string) => {
    const nextDraft = { ...(drafts[document.id] ?? toFormValues(document)), [field]: value }
    const nextErrors = validateDocument(nextDraft)
    setDrafts({ ...drafts, [document.id]: nextDraft })
    setErrors({ ...errors, [document.id]: nextErrors })
    setDirtyIds((current) => new Set(current).add(document.id))
  }

  const resetRow = (document: DocumentRecord) => {
    const nextDrafts = { ...drafts, [document.id]: toFormValues(document) }
    const nextErrors = { ...errors }
    delete nextErrors[document.id]
    setDrafts(nextDrafts)
    setErrors(nextErrors)
    setDirtyIds((current) => {
      const next = new Set(current)
      next.delete(document.id)
      return next
    })
  }

  const saveRow = async (document: DocumentRecord) => {
    const values = normalizeDocumentValues(drafts[document.id] ?? toFormValues(document))
    const nextErrors = validateDocument(values)
    setErrors({ ...errors, [document.id]: nextErrors })
    if (hasErrors(nextErrors)) return
    await onInlineSave(document.id, values)
    setDirtyIds((current) => {
      const next = new Set(current)
      next.delete(document.id)
      return next
    })
  }

  if (!loading && documents.length === 0) {
    return (
      <section className="empty-state">
        <Pencil size={28} />
        <h2>{t('table.emptyTitle')}</h2>
        <p>{t('table.emptyBody')}</p>
      </section>
    )
  }

  return (
    <section className="table-shell" aria-label="Documents table">
      <div className="table-head">
        {columns.map((column) => (
          <div key={column}>{column}</div>
        ))}
      </div>
      <div ref={parentRef} className="table-scroll">
        {loading && <div className="loading-cover">{t('table.loading')}</div>}
        <div style={{ height: totalSize, position: 'relative' }}>
          {virtualRows.map((virtualRow) => {
            const document = documents[virtualRow.index]
            const draft = drafts[document.id] ?? toFormValues(document)
            const rowErrors = errors[document.id] ?? {}
            const dirty = dirtyIds.has(document.id)

            return (
              <div
                className="table-row"
                key={document.id}
                style={{ transform: `translateY(${virtualRow.start}px)` }}
              >
                <label className="cell editable-cell">
                  <input value={draft.code} onChange={(event) => updateField(document, 'code', event.target.value)} />
                  {rowErrors.code && <small>{t(rowErrors.code)}</small>}
                </label>
                <label className="cell editable-cell title-cell">
                  <input
                    value={draft.title}
                    onChange={(event) => updateField(document, 'title', event.target.value)}
                  />
                  {rowErrors.title && <small>{t(rowErrors.title)}</small>}
                </label>
                <label className="cell editable-cell">
                  <select
                    value={draft.category}
                    onChange={(event) => updateField(document, 'category', event.target.value)}
                  >
                    {DOCUMENT_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {t(`category.${category}`)}
                      </option>
                    ))}
                  </select>
                  {rowErrors.category && <small>{t(rowErrors.category)}</small>}
                </label>
                <label className="cell editable-cell">
                  <div className="status-cell-control">
                    <StatusBadge status={draft.status} />
                    <select value={draft.status} onChange={(event) => updateField(document, 'status', event.target.value)}>
                      {DOCUMENT_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {t(`status.${status}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                  {rowErrors.status && <small>{t(rowErrors.status)}</small>}
                </label>
                <label className="cell editable-cell">
                  <input
                    value={draft.createdBy}
                    onChange={(event) => updateField(document, 'createdBy', event.target.value)}
                  />
                  {rowErrors.createdBy && <small>{t(rowErrors.createdBy)}</small>}
                </label>
                <div className="cell date-cell">{new Intl.DateTimeFormat('en-GB').format(new Date(document.createdDate))}</div>
                <div className="cell row-actions">
                  <button
                    className="icon-button"
                    type="button"
                    title={t('table.saveRow')}
                    aria-label={t('table.saveRow')}
                    disabled={!dirty || saving || hasErrors(rowErrors)}
                    onClick={() => void saveRow(document)}
                  >
                    <Check size={17} />
                  </button>
                  <button
                    className="icon-button"
                    type="button"
                    title={t('table.resetRow')}
                    aria-label={t('table.resetRow')}
                    disabled={!dirty || saving}
                    onClick={() => resetRow(document)}
                  >
                    <RotateCcw size={17} />
                  </button>
                  <button className="icon-button" type="button" title={t('table.editModal')} aria-label={t('table.editModal')} onClick={() => onEdit(document)}>
                    <Pencil size={17} />
                  </button>
                  {role === 'ADMIN' && (
                    <button
                      className="icon-button danger-icon"
                      type="button"
                      title={t('table.delete')}
                      aria-label={t('table.delete')}
                      onClick={() => onDelete(document)}
                    >
                      <Trash2 size={17} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
