import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_STATUSES,
  type DocumentCategory,
  type DocumentRecord,
  type DocumentStatus,
} from '../types/document'

const titleNouns = [
  'Supplier onboarding',
  'Safety compliance',
  'Revenue reconciliation',
  'Vehicle registration',
  'Vendor agreement',
  'Employee handbook',
  'Incident review',
  'Training evidence',
]

const people = ['nguyen.an', 'tran.binh', 'le.chi', 'pham.dung', 'hoang.em', 'vo.giang']

export function createMockDocuments(count = 1250): DocumentRecord[] {
  return Array.from({ length: count }, (_, index) => {
    const number = index + 1
    const category = DOCUMENT_CATEGORIES[index % DOCUMENT_CATEGORIES.length]
    const status = DOCUMENT_STATUSES[index % DOCUMENT_STATUSES.length]
    const createdBy = people[index % people.length]
    const date = new Date(2026, 0, 1 + (index % 170))

    return {
      id: crypto.randomUUID(),
      code: `EVD-${String(number).padStart(5, '0')}`,
      title: `${titleNouns[index % titleNouns.length]} ${number}`,
      category: category as DocumentCategory,
      status: status as DocumentStatus,
      createdBy,
      createdDate: date.toISOString(),
    }
  })
}
