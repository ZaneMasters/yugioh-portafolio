import { useQuery } from '@tanstack/react-query'
import { getBanlist } from '../services/externalService'
import { queryKeys } from '../lib/queryKeys'

/**
 * Hook para consultar cartas de la Banlist oficial directamente desde YGOProdeck
 * @param {'tcg' | 'ocg' | 'goat'} format
 */
export function useBanlist(format = 'tcg') {
  const { data: cards = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: queryKeys.banlist(format),
    queryFn: ({ signal }) => getBanlist(format, signal),
    select: (res) => res?.data ?? [],
    staleTime: 60 * 60 * 1000, // 1 hora de caché fresca
    gcTime: 24 * 60 * 60 * 1000, // 24 horas en memoria
  })

  return { cards, loading, error, refetch }
}
