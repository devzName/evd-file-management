export const DOCUMENT_CATEGORIES = [
  'Policy',
  'Contract',
  'Invoice',
  'Report',
  'Certificate',
  'Other',
] as const

export const DOCUMENT_STATUSES = ['Draft', 'Review', 'Approved', 'Archived'] as const

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number]
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number]
export type UserRole = 'ADMIN' | 'STAFF'

export interface DocumentRecord {
  id: string
  code: string
  title: string
  category: DocumentCategory
  status: DocumentStatus
  createdBy: string
  createdDate: string
}

export type DocumentFormValues = Omit<DocumentRecord, 'id' | 'createdDate'>

export interface DocumentFilters {
  search: string
  status: 'ALL' | DocumentStatus
  category: 'ALL' | DocumentCategory
  page: number
  pageSize: number
}

export interface PaginatedDocuments {
  data: DocumentRecord[]
  total: number
}

export interface ImportInvalidRow {
  rowNumber: number
  values: Partial<DocumentFormValues>
  errors: Partial<Record<keyof DocumentFormValues, string>>
}

export interface ImportSummary {
  totalRows: number
  validRows: DocumentFormValues[]
  invalidRows: ImportInvalidRow[]
}
