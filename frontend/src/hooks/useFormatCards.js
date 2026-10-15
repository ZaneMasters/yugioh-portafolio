import { useQuery } from '@tanstack/react-query'
import { getFormatCards } from '../services/externalService'
import { queryKeys } from '../lib/queryKeys'

/**
 * Hook para consultar el catálogo de cartas legales de un formato (ej: 'goat', 'edison')
 * @param {string} format
 */
export function useFormatCards(format = 'goat') {
  const { data: cards = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: queryKeys.formatCards(format),
    queryFn: ({ signal }) => getFormatCards(format, signal),
    select: (res) => res?.data ?? [],
    staleTime: 60 * 60 * 1000, // 1 hora fresca
    gcTime: 24 * 60 * 60 * 1000, // 24 horas en caché
    enabled: !!format,
  })

  return { cards, loading, error, refetch }
}
