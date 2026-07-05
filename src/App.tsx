import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, ShieldCheck } from 'lucide-react'
import './App.css'
import { ConfirmDialog } from './components/ConfirmDialog'
import { DocumentFormModal } from './components/DocumentFormModal'
import { DocumentTable } from './components/DocumentTable'
import { DocumentToolbar } from './components/DocumentToolbar'
import { ImportModal } from './components/ImportModal'
import { Pagination } from './components/Pagination'
import { useI18n } from './i18n'
import { useDocumentsStore } from './store/useDocumentsStore'
import type { DocumentRecord } from './types/document'

function App() {
  const { locale, setLocale, t } = useI18n()
  const {
    documents,
    total,
    filters,
    loading,
    saving,
    error,
    role,
    currentUser,
    importProgress,
    setRole,
    setFilters,
    fetchDocuments,
    createDocument,
    updateDocument,
    deleteDocument,
    importDocuments,
    clearError,
  } = useDocumentsStore()
  const [formDocument, setFormDocument] = useState<DocumentRecord | null | undefined>(undefined)
  const [deleteTarget, setDeleteTarget] = useState<DocumentRecord | null>(null)
  const [importOpen, setImportOpen] = useState(false)

  const loadDocuments = useCallback(() => {
    void fetchDocuments()
  }, [fetchDocuments])

  useEffect(() => {
    loadDocuments()
  }, [filters, loadDocuments])

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <span className="eyebrow">{t('app.section')}</span>
          <h1>{t('app.title')}</h1>
        </div>
        <div className="header-actions">
          <div className="segmented-control" aria-label={t('toolbar.language')}>
            {(['en', 'vi'] as const).map((value) => (
              <button
                key={value}
                type="button"
                className={value === locale ? 'active' : ''}
                onClick={() => setLocale(value)}
              >
                {value.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="segmented-control" aria-label={t('toolbar.role')}>
            {(['ADMIN', 'STAFF'] as const).map((value) => (
              <button
                key={value}
                type="button"
                className={value === role ? 'active' : ''}
                onClick={() => setRole(value)}
              >
                {value}
              </button>
            ))}
          </div>
          <div className="user-chip">
            <ShieldCheck size={18} />
            <span>{role}</span>
            <strong>{currentUser}</strong>
          </div>
        </div>
      </header>

      <DocumentToolbar
        filters={filters}
        onFiltersChange={setFilters}
        onCreate={() => setFormDocument(null)}
        onImport={() => setImportOpen(true)}
      />

      {error && (
        <div className="error-banner">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button type="button" onClick={clearError}>
            {t('common.dismiss')}
          </button>
        </div>
      )}

      <DocumentTable
        documents={documents}
        loading={loading}
        role={role}
        saving={saving}
        onEdit={(document) => setFormDocument(document)}
        onDelete={(document) => setDeleteTarget(document)}
        onInlineSave={updateDocument}
      />

      <Pagination
        page={filters.page}
        pageSize={filters.pageSize}
        total={total}
        onPageChange={(page) => setFilters({ page })}
        onPageSizeChange={(pageSize) => setFilters({ pageSize })}
      />

      {formDocument !== undefined && (
        <DocumentFormModal
          document={formDocument}
          busy={saving}
          currentUser={currentUser}
          onClose={() => setFormDocument(undefined)}
          onSubmit={(values) => (formDocument ? updateDocument(formDocument.id, values) : createDocument(values))}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title={t('delete.title')}
          message={t('delete.message', { code: deleteTarget.code })}
          confirmLabel={t('delete.confirm')}
          busy={saving}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={async () => {
            await deleteDocument(deleteTarget.id)
            setDeleteTarget(null)
          }}
        />
      )}

      {importOpen && (
        <ImportModal
          busy={saving}
          importProgress={importProgress}
          onClose={() => setImportOpen(false)}
          onImport={importDocuments}
        />
      )}
    </main>
  )
}

export default App
