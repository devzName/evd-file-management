import { useMemo, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_STATUSES,
  type DocumentFormValues,
  type DocumentRecord,
} from '../types/document'
import { hasErrors, normalizeDocumentValues, validateDocument } from '../utils/validation'
import { useI18n } from '../i18n'

interface DocumentFormModalProps {
  document?: DocumentRecord | null
  busy?: boolean
  currentUser: string
  onClose: () => void
  onSubmit: (values: DocumentFormValues) => Promise<void>
}

export function DocumentFormModal({
  document,
  busy,
  currentUser,
  onClose,
  onSubmit,
}: DocumentFormModalProps) {
  const { t } = useI18n()
  const initialValues = useMemo<DocumentFormValues>(
    () => ({
      code: document?.code ?? '',
      title: document?.title ?? '',
      category: document?.category ?? 'Policy',
      status: document?.status ?? 'Draft',
      createdBy: document?.createdBy ?? currentUser,
    }),
    [currentUser, document],
  )
  const [values, setValues] = useState<DocumentFormValues>(initialValues)
  const [errors, setErrors] = useState(validateDocument(initialValues))

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const nextValues = normalizeDocumentValues(values)
    const nextErrors = validateDocument(nextValues)
    setErrors(nextErrors)
    if (hasErrors(nextErrors)) return
    await onSubmit(nextValues)
    onClose()
  }

  const setField = (field: keyof DocumentFormValues, value: string) => {
    const nextValues = { ...values, [field]: value }
    setValues(nextValues)
    setErrors(validateDocument(nextValues))
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="document-form-title">
        <button className="icon-button close-button" type="button" onClick={onClose} aria-label={t('form.close')}>
          <X size={18} />
        </button>
        <h2 id="document-form-title">{document ? t('form.edit') : t('form.create')}</h2>
        <form className="document-form" onSubmit={handleSubmit}>
          <label>
            <span>{t('table.code')}</span>
            <input value={values.code} onChange={(event) => setField('code', event.target.value)} />
            {errors.code && <small>{t(errors.code)}</small>}
          </label>
          <label>
            <span>{t('table.title')}</span>
            <input value={values.title} onChange={(event) => setField('title', event.target.value)} />
            {errors.title && <small>{t(errors.title)}</small>}
          </label>
          <div className="form-grid">
            <label>
              <span>{t('table.category')}</span>
              <select value={values.category} onChange={(event) => setField('category', event.target.value)}>
                {DOCUMENT_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {t(`category.${category}`)}
                  </option>
                ))}
              </select>
              {errors.category && <small>{t(errors.category)}</small>}
            </label>
            <label>
              <span>{t('table.status')}</span>
              <select value={values.status} onChange={(event) => setField('status', event.target.value)}>
                {DOCUMENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {t(`status.${status}`)}
                  </option>
                ))}
              </select>
              {errors.status && <small>{t(errors.status)}</small>}
            </label>
          </div>
          <label>
            <span>{t('table.createdBy')}</span>
            <input value={values.createdBy} onChange={(event) => setField('createdBy', event.target.value)} />
            {errors.createdBy && <small>{t(errors.createdBy)}</small>}
          </label>
          <div className="modal-actions">
            <button className="secondary-button" type="button" onClick={onClose} disabled={busy}>
              {t('form.cancel')}
            </button>
            <button className="primary-button" type="submit" disabled={busy || hasErrors(errors)}>
              {busy ? t('form.saving') : t('form.save')}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
