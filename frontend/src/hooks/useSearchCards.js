import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { searchExternalCards } from '../services/externalService'
import { queryKeys } from '../lib/queryKeys'

/**
 * Hook para buscar cartas en la API externa de YGOProdeck.
 *
 * TanStack Query reemplaza el caché manual (Map + sessionStorage) y el
 * AbortController. La caché es global: si dos componentes buscan la misma
 * query, solo se hace una petición.
 *
 * staleTime: 10 min → resultados de YGOProdeck cambian muy raramente.
 * gcTime: 30 min   → los resultados se mantienen en memoria sin refetch.
 */
export function useSearchCards(query = '', lang = 'en') {
  const trimmed = query.trim()

  const { data: results = [], isFetching: searching } = useQuery({
    queryKey: queryKeys.search(trimmed, lang),
    queryFn: ({ signal }) => searchExternalCards(trimmed, lang, signal),
    select: (res) => res.data ?? [],
    enabled: trimmed.length >= 2,
    staleTime: 10 * 60 * 1000,  // 10 minutos
    gcTime:    30 * 60 * 1000,  // 30 minutos en memoria
    retry: false,
    throwOnError: false,
    meta: {
      onError: (err) => {
        if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
          toast.error(err.message || 'Error al buscar cartas')
        }
      },
    },
  })

  return { results, searching }
}
