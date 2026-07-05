import {
  type DocumentFilters,
  type DocumentFormValues,
  type DocumentRecord,
  type PaginatedDocuments,
} from '../types/document'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    ...init,
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(body?.message ?? `Request failed with status ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

function buildDocumentsUrl(filters: DocumentFilters, owner?: string) {
  const params = new URLSearchParams({
    search: filters.search,
    status: filters.status,
    category: filters.category,
    page: String(filters.page),
    pageSize: String(filters.pageSize),
  })

  if (owner) params.set('owner', owner)

  return `${API_BASE_URL}/documents?${params.toString()}`
}

export const documentsApi = {
  getDocuments(filters: DocumentFilters, owner?: string): Promise<PaginatedDocuments> {
    return requestJson<PaginatedDocuments>(buildDocumentsUrl(filters, owner))
  },

  createDocument(values: DocumentFormValues): Promise<DocumentRecord> {
    return requestJson<DocumentRecord>(`${API_BASE_URL}/documents`, {
      method: 'POST',
      body: JSON.stringify(values),
    })
  },

  updateDocument(id: string, values: Partial<DocumentFormValues>): Promise<DocumentRecord> {
    return requestJson<DocumentRecord>(`${API_BASE_URL}/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(values),
    })
  },

  deleteDocument(id: string): Promise<void> {
    return requestJson<void>(`${API_BASE_URL}/documents/${id}`, {
      method: 'DELETE',
    })
  },

  async bulkImport(rows: DocumentFormValues[], onProgress?: (progress: number) => void): Promise<number> {
    const chunkSize = 500
    let imported = 0

    for (let index = 0; index < rows.length; index += chunkSize) {
      const chunk = rows.slice(index, index + chunkSize)
      const result = await requestJson<{ imported: number }>(`${API_BASE_URL}/documents/bulk-import`, {
        method: 'POST',
        body: JSON.stringify({ rows: chunk }),
      })
      imported += result.imported
      onProgress?.(Math.round((imported / Math.max(rows.length, 1)) * 100))
    }

    return imported
  },
}
