import { useQuery } from '@tanstack/react-query'
import { userService } from '../services/userService'
import { queryKeys } from '../lib/queryKeys'

/**
 * Hook para cargar la lista de coleccionistas públicos
 */
export function usePublicUsers() {
  const { data: users = [], isLoading: loading, error } = useQuery({
    queryKey: queryKeys.publicUsers(),
    queryFn: () => userService.getPublicUsers(),
    select: (res) => res.data ?? res ?? [],
    staleTime: 30 * 1000, // 30 segundos
  })

  return { users, loading, error }
}
