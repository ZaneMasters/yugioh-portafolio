import { useQuery } from '@tanstack/react-query'
import { folderService } from '../services/folderService'
import { queryKeys } from '../lib/queryKeys'

/**
 * Hook para cargar las colecciones públicas de un usuario por su slug.
 * Sincroniza automáticamente en tiempo real.
 */
export function usePublicFolders(slug) {
  const { data: folders = [], isLoading: loading } = useQuery({
    queryKey: queryKeys.publicFolders(slug),
    queryFn: () => folderService.getPublicFolders(slug),
    select: (res) => res.data ?? res ?? [],
    enabled: !!slug,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  })

  return { folders, loading }
}
