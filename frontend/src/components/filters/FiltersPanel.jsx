import { SearchInput } from '../ui/Input'
import { Select } from '../ui/Select'
import { CARD_TYPES } from '../../utils/constants'

const typeOptions = CARD_TYPES

export function FiltersPanel({ filters, onChange }) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <SearchInput
        placeholder="Buscar por nombre..."
        value={filters.name}
        onChange={(e) => onChange({ ...filters, name: e.target.value })}
        className="flex-1"
      />
      <Select
        placeholder="Todas las Cartas"
        options={typeOptions}
        value={filters.type}
        onChange={(e) => onChange({ ...filters, type: e.target.value })}
        className="sm:w-52"
      />
      <SearchInput
        placeholder="Arquetipo..."
        value={filters.archetype}
        onChange={(e) => onChange({ ...filters, archetype: e.target.value })}
        className="sm:w-52"
      />
    </div>
  )
}
