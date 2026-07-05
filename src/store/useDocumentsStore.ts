import { create } from 'zustand'
import { documentsApi } from '../api/documentsApi'
import {
  type DocumentFilters,
  type DocumentFormValues,
  type DocumentRecord,
  type UserRole,
} from '../types/document'

const defaultFilters: DocumentFilters = {
  search: '',
  status: 'ALL',
  category: 'ALL',
  page: 1,
  pageSize: 25,
}

interface DocumentsState {
  documents: DocumentRecord[]
  total: number
  filters: DocumentFilters
  loading: boolean
  saving: boolean
  error: string | null
  currentUser: string
  role: UserRole
  importProgress: number
  setRole: (role: UserRole) => void
  setFilters: (filters: Partial<DocumentFilters>) => void
  fetchDocuments: () => Promise<void>
  createDocument: (values: DocumentFormValues) => Promise<void>
  updateDocument: (id: string, values: Partial<DocumentFormValues>) => Promise<void>
  deleteDocument: (id: string) => Promise<void>
  importDocuments: (rows: DocumentFormValues[], onProgress?: (progress: number) => void) => Promise<void>
  setImportProgress: (progress: number) => void
  clearError: () => void
}

export const useDocumentsStore = create<DocumentsState>((set, get) => ({
  documents: [],
  total: 0,
  filters: defaultFilters,
  loading: false,
  saving: false,
  error: null,
  currentUser: 'nguyen.an',
  role: 'ADMIN',
  importProgress: 0,

  setRole: (role) => {
    set({ role, filters: { ...get().filters, page: 1 } })
    void get().fetchDocuments()
  },

  setFilters: (filters) => {
    const shouldResetPage = Object.keys(filters).some((key) => key !== 'page')
    set({
      filters: {
        ...get().filters,
        ...filters,
        page: shouldResetPage ? 1 : (filters.page ?? get().filters.page),
      },
    })
  },

  fetchDocuments: async () => {
    const { filters, role, currentUser } = get()
    set({ loading: true, error: null })
    try {
      const owner = role === 'STAFF' ? currentUser : undefined
      const result = await documentsApi.getDocuments(filters, owner)
      set({ documents: result.data, total: result.total, loading: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unable to load documents', loading: false })
    }
  },

  createDocument: async (values) => {
    set({ saving: true, error: null })
    try {
      await documentsApi.createDocument(values)
      set({ saving: false, filters: { ...get().filters, page: 1 } })
      await get().fetchDocuments()
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unable to create document', saving: false })
      throw error
    }
  },

  updateDocument: async (id, values) => {
    set({ saving: true, error: null })
    try {
      const updated = await documentsApi.updateDocument(id, values)
      set({
        saving: false,
        documents: get().documents.map((document) => (document.id === id ? updated : document)),
      })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unable to update document', saving: false })
      throw error
    }
  },

  deleteDocument: async (id) => {
    set({ saving: true, error: null })
    try {
      await documentsApi.deleteDocument(id)
      set({ saving: false })
      await get().fetchDocuments()
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unable to delete document', saving: false })
      throw error
    }
  },

  importDocuments: async (rows, onProgress) => {
    set({ saving: true, importProgress: 0, error: null })
    try {
      await documentsApi.bulkImport(rows, (progress) => {
        set({ importProgress: progress })
        onProgress?.(progress)
      })
      set({ saving: false, filters: { ...get().filters, page: 1 } })
      await get().fetchDocuments()
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unable to import documents', saving: false })
      throw error
    }
  },

  setImportProgress: (progress) => set({ importProgress: progress }),
  clearError: () => set({ error: null }),
}))
