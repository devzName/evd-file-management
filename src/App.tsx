import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertCircle, ShieldCheck } from 'lucide-react'
import './App.css'
import { ConfirmDialog } from './components/ConfirmDialog'
import { DocumentFormModal } from './components/DocumentFormModal'
import { DocumentTable } from './components/DocumentTable'
import { DocumentToolbar } from './components/DocumentToolbar'
import { ImportModal } from './components/ImportModal'
import { Notifications } from './components/Notifications'
import { Pagination } from './components/Pagination'
import { useI18n } from './i18n'
import { useDocumentsStore } from './store/useDocumentsStore'
import { useNotificationsStore } from './store/useNotificationsStore'
import type { DocumentRecord } from './types/document'

function App() {
  const { locale, setLocale, t } = useI18n()
  const notify = useNotificationsStore((state) => state.notify)
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
  const pendingScrollYRef = useRef<number | null>(null)

  const loadDocuments = useCallback(() => {
    void fetchDocuments()
  }, [fetchDocuments])

  const getErrorMessage = (error: unknown, fallbackKey: string) =>
    error instanceof Error ? error.message : t(fallbackKey)

  const handleCreateOrUpdate = async (document: DocumentRecord | null, values: Parameters<typeof createDocument>[0]) => {
    try {
      if (document) {
        await updateDocument(document.id, values)
        notify('success', t('notification.updateSuccess'))
      } else {
        await createDocument(values)
        notify('success', t('notification.createSuccess'))
      }
    } catch (error) {
      notify('error', getErrorMessage(error, 'notification.saveError'))
      throw error
    }
  }

  const handleInlineSave = async (id: string, values: Parameters<typeof updateDocument>[1]) => {
    try {
      await updateDocument(id, values)
      notify('success', t('notification.updateSuccess'))
    } catch (error) {
      notify('error', getErrorMessage(error, 'notification.saveError'))
      throw error
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteDocument(id)
      notify('success', t('notification.deleteSuccess'))
    } catch (error) {
      notify('error', getErrorMessage(error, 'notification.deleteError'))
      throw error
    }
  }

  const handleImport = async (rows: Parameters<typeof importDocuments>[0]) => {
    try {
      await importDocuments(rows)
      notify('success', t('notification.importSuccess', { count: rows.length }))
    } catch (error) {
      notify('error', getErrorMessage(error, 'notification.importError'))
      throw error
    }
  }

  const keepPageScroll = (action: () => void) => {
    pendingScrollYRef.current = window.scrollY
    action()
  }

  useEffect(() => {
    loadDocuments()
  }, [filters, loadDocuments])

  useEffect(() => {
    if (pendingScrollYRef.current === null) return

    const scrollY = pendingScrollYRef.current
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY)
      if (!loading) pendingScrollYRef.current = null
    })
  }, [documents, loading])

  return (
    <main className="app-shell">
      <Notifications />
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
        onInlineSave={handleInlineSave}
      />

      <Pagination
        page={filters.page}
        pageSize={filters.pageSize}
        total={total}
        onPageChange={(page) => keepPageScroll(() => setFilters({ page }))}
        onPageSizeChange={(pageSize) => keepPageScroll(() => setFilters({ pageSize }))}
      />

      {formDocument !== undefined && (
        <DocumentFormModal
          document={formDocument}
          busy={saving}
          currentUser={currentUser}
          onClose={() => setFormDocument(undefined)}
          onSubmit={(values) => handleCreateOrUpdate(formDocument, values)}
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
            await handleDelete(deleteTarget.id)
            setDeleteTarget(null)
          }}
        />
      )}

      {importOpen && (
        <ImportModal
          busy={saving}
          importProgress={importProgress}
          onClose={() => setImportOpen(false)}
          onImport={handleImport}
        />
      )}
    </main>
  )
}

export default App
