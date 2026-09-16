import { useQuery } from '@tanstack/react-query'
import { searchCardsBySet } from '../services/cardService'
import { queryKeys } from '../lib/queryKeys'

/**
 * Hook para buscar cartas en el catálogo exclusivamente por código de set
 */
export function useSearchBySet(code) {
  const clean = (code || '').trim()

  const { data: cards = [], isLoading: loading, isFetching, error } = useQuery({
    queryKey: queryKeys.searchBySet(clean),
    queryFn: () => searchCardsBySet(clean),
    select: (res) => res.data ?? res ?? [],
    enabled: !!clean && clean.length >= 2,
    staleTime: 2 * 60 * 1000,
  })

  return { cards, loading: loading || isFetching, error }
}
