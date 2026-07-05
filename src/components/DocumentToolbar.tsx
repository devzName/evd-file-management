import { useEffect, useState } from 'react'
import { FilePlus2, Search, Upload } from 'lucide-react'
import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_STATUSES,
  type DocumentFilters,
} from '../types/document'
import { useI18n } from '../i18n'
import { useDebouncedValue } from '../hooks/useDebouncedValue'

interface DocumentToolbarProps {
  filters: DocumentFilters
  onFiltersChange: (filters: Partial<DocumentFilters>) => void
  onCreate: () => void
  onImport: () => void
}

export function DocumentToolbar({
  filters,
  onFiltersChange,
  onCreate,
  onImport,
}: DocumentToolbarProps) {
  const { t } = useI18n()
  const [search, setSearch] = useState(filters.search)
  const debouncedSearch = useDebouncedValue(search)

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onFiltersChange({ search: debouncedSearch })
    }
  }, [debouncedSearch, filters.search, onFiltersChange])

  useEffect(() => {
    setSearch(filters.search)
  }, [filters.search])

  return (
    <section className="toolbar" aria-label="Document controls">
      <div className="search-box">
        <Search size={18} />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('toolbar.search')}
          aria-label={t('toolbar.search')}
        />
      </div>
      <select
        value={filters.status}
        onChange={(event) => onFiltersChange({ status: event.target.value as DocumentFilters['status'] })}
        aria-label={t('table.status')}
      >
        <option value="ALL">{t('toolbar.allStatuses')}</option>
        {DOCUMENT_STATUSES.map((status) => (
          <option key={status} value={status}>
            {t(`status.${status}`)}
          </option>
        ))}
      </select>
      <select
        value={filters.category}
        onChange={(event) => onFiltersChange({ category: event.target.value as DocumentFilters['category'] })}
        aria-label={t('table.category')}
      >
        <option value="ALL">{t('toolbar.allCategories')}</option>
        {DOCUMENT_CATEGORIES.map((category) => (
          <option key={category} value={category}>
            {t(`category.${category}`)}
          </option>
        ))}
      </select>
      <button className="secondary-button" type="button" onClick={onImport}>
        <Upload size={17} />
        {t('toolbar.import')}
      </button>
      <button className="primary-button" type="button" onClick={onCreate}>
        <FilePlus2 size={17} />
        {t('toolbar.create')}
      </button>
    </section>
  )
}
