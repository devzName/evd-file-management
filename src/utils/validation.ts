import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_STATUSES,
  type DocumentCategory,
  type DocumentFormValues,
  type DocumentStatus,
} from '../types/document'

export type ValidationErrors<T> = Partial<Record<keyof T, string>>

const codePattern = /^[A-Z0-9-]+$/

export function isDocumentCategory(value: unknown): value is DocumentCategory {
  return typeof value === 'string' && DOCUMENT_CATEGORIES.includes(value as DocumentCategory)
}

export function isDocumentStatus(value: unknown): value is DocumentStatus {
  return typeof value === 'string' && DOCUMENT_STATUSES.includes(value as DocumentStatus)
}

export function validateDocument(values: Partial<DocumentFormValues>): ValidationErrors<DocumentFormValues> {
  const errors: ValidationErrors<DocumentFormValues> = {}
  const code = values.code?.trim() ?? ''
  const title = values.title?.trim() ?? ''
  const createdBy = values.createdBy?.trim() ?? ''

  if (!code) errors.code = 'validation.code.required'
  else if (code.length < 3 || code.length > 24) errors.code = 'validation.code.length'
  else if (!codePattern.test(code)) errors.code = 'validation.code.pattern'

  if (!title) errors.title = 'validation.title.required'
  else if (title.length < 4 || title.length > 120) errors.title = 'validation.title.length'

  if (!values.category) errors.category = 'validation.category.required'
  else if (!isDocumentCategory(values.category)) errors.category = 'validation.category.invalid'

  if (!values.status) errors.status = 'validation.status.required'
  else if (!isDocumentStatus(values.status)) errors.status = 'validation.status.invalid'

  if (!createdBy) errors.createdBy = 'validation.createdBy.required'
  else if (createdBy.length > 60) errors.createdBy = 'validation.createdBy.length'

  return errors
}

export function hasErrors(errors: object) {
  return Object.keys(errors).length > 0
}

export function normalizeDocumentValues(values: Partial<DocumentFormValues>): DocumentFormValues {
  return {
    code: values.code?.trim().toUpperCase() ?? '',
    title: values.title?.trim() ?? '',
    category: values.category as DocumentCategory,
    status: values.status as DocumentStatus,
    createdBy: values.createdBy?.trim() ?? '',
  }
}
