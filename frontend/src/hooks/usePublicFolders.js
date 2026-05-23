import { useQuery } from '@tanstack/react-query'
import { folderService } from '../services/folderService'
import { queryKeys } from '../lib/queryKeys'

/**
 * Hook para cargar las colecciones públicas de un usuario por su slug.
 * Los datos públicos se cachean 5 minutos (raramente cambian).
 */
export function usePublicFolders(slug) {
  const { data: folders = [], isLoading: loading } = useQuery({
    queryKey: queryKeys.publicFolders(slug),
    queryFn: () => folderService.getPublicFolders(slug),
    select: (res) => res.data ?? res ?? [],
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })

  return { folders, loading }
}
