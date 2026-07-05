import { useRef, useState, type ChangeEvent } from 'react'
import { Download, Upload, X } from 'lucide-react'
import type { DocumentFormValues, ImportSummary } from '../types/document'
import { parseImportFile } from '../utils/importParser'
import { useI18n } from '../i18n'

interface ImportModalProps {
  busy?: boolean
  importProgress: number
  onClose: () => void
  onImport: (rows: DocumentFormValues[]) => Promise<void>
}

export function ImportModal({ busy, importProgress, onClose, onImport }: ImportModalProps) {
  const { t } = useI18n()
  const inputRef = useRef<HTMLInputElement>(null)
  const [summary, setSummary] = useState<ImportSummary | null>(null)
  const [parseProgress, setParseProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [parsing, setParsing] = useState(false)

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setParsing(true)
    setError(null)
    setSummary(null)
    setParseProgress(0)
    try {
      const result = await parseImportFile(file, setParseProgress)
      setSummary(result)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : t('import.parseError'))
    } finally {
      setParsing(false)
    }
  }

  const downloadTemplate = () => {
    const csv = 'code,title,category,status,createdBy\nEVD-90001,Sample policy,Policy,Draft,nguyen.an\n'
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'evd-import-template.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const canImport = Boolean(summary?.validRows.length) && !busy && !parsing

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal wide-modal" role="dialog" aria-modal="true" aria-labelledby="import-title">
        <button className="icon-button close-button" type="button" onClick={onClose} aria-label={t('form.close')}>
          <X size={18} />
        </button>
        <h2 id="import-title">{t('import.title')}</h2>
        <div className="import-dropzone" onClick={() => inputRef.current?.click()} role="button" tabIndex={0}>
          <Upload size={24} />
          <strong>{t('import.upload')}</strong>
          <span>{t('import.requiredColumns')}</span>
          <input ref={inputRef} type="file" accept=".csv,.xlsx" onChange={handleFile} hidden />
        </div>
        <div className="import-toolbar">
          <button className="secondary-button" type="button" onClick={downloadTemplate}>
            <Download size={17} />
            {t('import.template')}
          </button>
          <div className="progress">
            <span>{t('import.parse', { progress: parseProgress })}</span>
            <div>
              <i style={{ width: `${parseProgress}%` }} />
            </div>
          </div>
          <div className="progress">
            <span>{t('import.progress', { progress: importProgress })}</span>
            <div>
              <i style={{ width: `${importProgress}%` }} />
            </div>
          </div>
        </div>
        {error && <div className="error-banner">{error}</div>}
        {summary && (
          <div className="import-summary">
            <span>{t('import.rowsParsed', { count: summary.totalRows })}</span>
            <span>{t('import.valid', { count: summary.validRows.length })}</span>
            <span>{t('import.invalid', { count: summary.invalidRows.length })}</span>
          </div>
        )}
        {summary?.invalidRows.length ? (
          <div className="invalid-table">
            <div className="invalid-header">{t('import.invalidRows')}</div>
            {summary.invalidRows.slice(0, 12).map((row) => (
              <div className="invalid-row" key={row.rowNumber}>
                <strong>{t('import.row', { row: row.rowNumber })}</strong>
                <span>{Object.values(row.errors).map((errorKey) => t(errorKey)).join(', ')}</span>
              </div>
            ))}
            {summary.invalidRows.length > 12 && <small>{t('import.firstRows')}</small>}
          </div>
        ) : null}
        <div className="modal-actions">
          <button className="secondary-button" type="button" onClick={onClose} disabled={busy}>
            {t('form.cancel')}
          </button>
          <button
            className="primary-button"
            type="button"
            disabled={!canImport}
            onClick={async () => {
              if (!summary) return
              await onImport(summary.validRows)
              onClose()
            }}
          >
            {busy ? t('import.importing') : t('import.importValid')}
          </button>
        </div>
      </section>
    </div>
  )
}
