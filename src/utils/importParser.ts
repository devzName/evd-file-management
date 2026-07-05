import Papa from 'papaparse'
import readXlsxFile, { type Row } from 'read-excel-file/browser'
import ImportValidationWorker from '../workers/importValidationWorker.ts?worker&inline'
import { type ImportSummary } from '../types/document'

type RawRow = Record<string, unknown>

type ValidationWorkerResponse =
  | { type: 'progress'; progress: number }
  | { type: 'complete'; summary: ImportSummary }
  | { type: 'error'; message: string }

async function parseCsvFile(file: File, onProgress?: (progress: number) => void): Promise<RawRow[]> {
  return new Promise((resolve, reject) => {
    const rows: RawRow[] = []

    Papa.parse<RawRow>(file, {
      header: true,
      skipEmptyLines: true,
      worker: true,
      chunk: (result) => {
        rows.push(...result.data)
        const cursor = result.meta.cursor ?? 0
        const progress = Math.min(50, Math.round((cursor / Math.max(file.size, 1)) * 50))
        onProgress?.(progress)
      },
      complete: () => resolve(rows),
      error: (error) => reject(error),
    })
  })
}

function validateRowsInWorker(
  rows: RawRow[],
  progressStart: number,
  progressSpan: number,
  onProgress?: (progress: number) => void,
): Promise<ImportSummary> {
  return new Promise((resolve, reject) => {
    const worker = new ImportValidationWorker()

    worker.onmessage = (event: MessageEvent<ValidationWorkerResponse>) => {
      const message = event.data

      if (message.type === 'progress') {
        onProgress?.(message.progress)
        return
      }

      worker.terminate()

      if (message.type === 'complete') {
        resolve(message.summary)
      } else {
        reject(new Error(message.message))
      }
    }

    worker.onerror = (event) => {
      worker.terminate()
      reject(new Error(event.message || 'Unable to validate rows'))
    }

    worker.postMessage({
      type: 'validate',
      rows,
      rowOffset: 2,
      progressStart,
      progressSpan,
    })
  })
}

export async function parseImportFile(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<ImportSummary> {
  const extension = file.name.split('.').pop()?.toLowerCase()

  if (extension === 'csv') {
    const rows = await parseCsvFile(file, onProgress)
    return validateRowsInWorker(rows, 50, 50, onProgress)
  }

  if (extension === 'xlsx') {
    const sheets = await readXlsxFile(file)
    const sheetRows = sheets[0]?.data ?? []
    const [headers = [], ...body] = sheetRows
    const rows = body.map((row: Row) =>
      headers.reduce<RawRow>((acc: RawRow, header, index: number) => {
        acc[String(header ?? '')] = row[index] ?? ''
        return acc
      }, {}),
    )
    onProgress?.(50)
    return validateRowsInWorker(rows, 50, 50, onProgress)
  }

  throw new Error('Unsupported file type. Please upload CSV or XLSX.')
}
