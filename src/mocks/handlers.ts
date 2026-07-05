import { http, HttpResponse, delay, passthrough } from 'msw'
import { createMockDocuments } from '../utils/mockData'
import {
  type DocumentFilters,
  type DocumentFormValues,
  type DocumentRecord,
} from '../types/document'

let documentsDb: DocumentRecord[] = createMockDocuments()

function maybeFail() {
  if (Math.random() < 0.025) {
    return HttpResponse.json(
      { message: 'Mock API temporarily failed. Please retry.' },
      { status: 503 },
    )
  }

  return null
}

function applyFilters(items: DocumentRecord[], filters: DocumentFilters, owner?: string | null) {
  const search = filters.search.trim().toLowerCase()

  return items.filter((item) => {
    const matchesOwner = owner ? item.createdBy === owner : true
    const matchesSearch =
      !search ||
      item.title.toLowerCase().includes(search) ||
      item.code.toLowerCase().includes(search)
    const matchesStatus = filters.status === 'ALL' || item.status === filters.status
    const matchesCategory = filters.category === 'ALL' || item.category === filters.category

    return matchesOwner && matchesSearch && matchesStatus && matchesCategory
  })
}

function readFilters(request: Request): DocumentFilters {
  const url = new URL(request.url)

  return {
    search: url.searchParams.get('search') ?? '',
    status: (url.searchParams.get('status') ?? 'ALL') as DocumentFilters['status'],
    category: (url.searchParams.get('category') ?? 'ALL') as DocumentFilters['category'],
    page: Number(url.searchParams.get('page') ?? 1),
    pageSize: Number(url.searchParams.get('pageSize') ?? 25),
  }
}

export const handlers = [
  http.get('/node_modules/:path*', () => passthrough()),
  http.get('/src/:path*', () => passthrough()),
  http.get('/@vite/:path*', () => passthrough()),
  http.get('/@react-refresh', () => passthrough()),

  http.get('/api/documents', async ({ request }) => {
    await delay(420)
    const failure = maybeFail()
    if (failure) return failure

    const url = new URL(request.url)
    const filters = readFilters(request)
    const owner = url.searchParams.get('owner')
    const filtered = applyFilters(documentsDb, filters, owner)
    const start = (filters.page - 1) * filters.pageSize

    return HttpResponse.json({
      data: filtered.slice(start, start + filters.pageSize),
      total: filtered.length,
    })
  }),

  http.post('/api/documents', async ({ request }) => {
    await delay(300)
    const failure = maybeFail()
    if (failure) return failure

    const values = (await request.json()) as DocumentFormValues
    const created: DocumentRecord = {
      ...values,
      id: crypto.randomUUID(),
      createdDate: new Date().toISOString(),
    }
    documentsDb = [created, ...documentsDb]

    return HttpResponse.json(created, { status: 201 })
  }),

  http.put('/api/documents/:id', async ({ params, request }) => {
    await delay(280)
    const failure = maybeFail()
    if (failure) return failure

    const id = String(params.id)
    const values = (await request.json()) as Partial<DocumentFormValues>
    const existing = documentsDb.find((document) => document.id === id)

    if (!existing) {
      return HttpResponse.json({ message: 'Document not found' }, { status: 404 })
    }

    const updated = { ...existing, ...values }
    documentsDb = documentsDb.map((document) => (document.id === id ? updated : document))

    return HttpResponse.json(updated)
  }),

  http.delete('/api/documents/:id', async ({ params }) => {
    await delay(260)
    const failure = maybeFail()
    if (failure) return failure

    documentsDb = documentsDb.filter((document) => document.id !== String(params.id))

    return new HttpResponse(null, { status: 204 })
  }),

  http.post('/api/documents/bulk-import', async ({ request }) => {
    const { rows } = (await request.json()) as { rows: DocumentFormValues[] }
    const created = rows.map((row) => ({
      ...row,
      id: crypto.randomUUID(),
      createdDate: new Date().toISOString(),
    }))
    documentsDb = [...created, ...documentsDb]

    return HttpResponse.json({ imported: created.length }, { status: 201 })
  }),
]
