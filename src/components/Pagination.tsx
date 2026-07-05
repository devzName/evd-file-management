import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useI18n } from '../i18n'

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

type PageItem = number | 'ellipsis'

function getPageItems(page: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  if (page <= 4) {
    return [1, 2, 3, 4, 5, 'ellipsis', totalPages]
  }

  if (page >= totalPages - 3) {
    return [1, 'ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  }

  return [1, 'ellipsis', page - 1, page, page + 1, 'ellipsis', totalPages]
}

export function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange }: PaginationProps) {
  const { t } = useI18n()
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  const pageItems = getPageItems(page, totalPages)

  return (
    <footer className="pagination">
      <div className="pagination-summary">
        <span>
          {from}-{to} {t('pagination.of')} {total}
        </span>
        <select
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          aria-label="Page size"
        >
          {[25, 50, 100, 250].map((size) => (
            <option key={size} value={size}>
              {t('toolbar.rows', { count: size })}
            </option>
          ))}
        </select>
      </div>
      <nav className="pagination-pages" aria-label="Pagination">
        <button
          className="icon-button"
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          aria-label={t('pagination.previous')}
        >
          <ChevronLeft size={18} />
        </button>
        <span className="pagination-current">
          {t('pagination.page')} {page} / {totalPages}
        </span>
        {pageItems.map((item, index) =>
          item === 'ellipsis' ? (
            <span className="pagination-ellipsis" key={`ellipsis-${index}`}>
              ...
            </span>
          ) : (
            <button
              className={item === page ? 'page-button active' : 'page-button'}
              type="button"
              key={item}
              onClick={() => onPageChange(item)}
              aria-current={item === page ? 'page' : undefined}
            >
              {item}
            </button>
          ),
        )}
        <button
          className="icon-button"
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          aria-label={t('pagination.next')}
        >
          <ChevronRight size={18} />
        </button>
      </nav>
    </footer>
  )
}
