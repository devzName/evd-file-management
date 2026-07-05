import type { DocumentFormValues, ImportInvalidRow, ImportSummary } from '../types/document'
import { hasErrors, normalizeDocumentValues, validateDocument } from '../utils/validation'

const headerMap: Record<string, keyof DocumentFormValues> = {
  code: 'code',
  title: 'title',
  category: 'category',
  status: 'status',
  createdby: 'createdBy',
  created_by: 'createdBy',
  'created by': 'createdBy',
}

type RawRow = Record<string, unknown>

type WorkerRequest = {
  type: 'validate'
  rows: RawRow[]
  rowOffset: number
  progressStart: number
  progressSpan: number
}

type WorkerResponse =
  | { type: 'progress'; progress: number }
  | { type: 'complete'; summary: ImportSummary }
  | { type: 'error'; message: string }

function post(response: WorkerResponse) {
  self.postMessage(response)
}

function normalizeRow(row: RawRow): Partial<DocumentFormValues> {
  return Object.entries(row).reduce<Partial<DocumentFormValues>>((acc, [key, value]) => {
    const normalizedKey = key.trim().toLowerCase()
    const mappedKey = headerMap[normalizedKey]
    if (mappedKey) {
      acc[mappedKey] = String(value ?? '').trim() as never
    }
    return acc
  }, {})
}

async function yieldToWorker() {
  await new Promise((resolve) => self.setTimeout(resolve, 0))
}

async function buildSummary(
  rows: RawRow[],
  rowOffset: number,
  progressStart: number,
  progressSpan: number,
): Promise<ImportSummary> {
  const validRows: DocumentFormValues[] = []
  const invalidRows: ImportInvalidRow[] = []
  const chunkSize = 1000

  for (let index = 0; index < rows.length; index += chunkSize) {
    const chunk = rows.slice(index, index + chunkSize)
    chunk.forEach((row, chunkIndex) => {
      const values = normalizeRow(row)
      const errors = validateDocument(values)
      const rowNumber = index + chunkIndex + rowOffset

      if (hasErrors(errors)) {
        invalidRows.push({ rowNumber, values, errors })
      } else {
        validRows.push(normalizeDocumentValues(values))
      }
    })

    const progress = progressStart + Math.round(((index + chunk.length) / Math.max(rows.length, 1)) * progressSpan)
    post({ type: 'progress', progress })
    await yieldToWorker()
  }

  return { totalRows: rows.length, validRows, invalidRows }
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  if (event.data.type !== 'validate') return

  const { rows, rowOffset, progressStart, progressSpan } = event.data

  void buildSummary(rows, rowOffset, progressStart, progressSpan)
    .then((summary) => post({ type: 'complete', summary }))
    .catch((error) => post({ type: 'error', message: error instanceof Error ? error.message : 'Unable to validate rows' }))
}
