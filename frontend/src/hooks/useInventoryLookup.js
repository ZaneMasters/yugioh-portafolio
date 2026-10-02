import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import * as cardService from '../services/cardService'
import { useAuth } from '../context/AuthContext'

/**
 * Hook para consultar rápidamente si una carta o setCode ya está en el inventario del usuario logueado.
 * Mantiene un índice en memoria para lookups O(1) instantáneos.
 */
export function useInventoryLookup() {
  const { user } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['inventory-lookup'],
    queryFn: async () => {
      const res = await cardService.getCards({ paginate: false })
      return res.data ?? []
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  })

  const lookup = useMemo(() => {
    const byCardId  = new Map()
    const byName    = new Map()
    const bySetCode = new Map()

    const normName = (str) => (!str ? '' : str.toLowerCase().replace(/[^a-z0-9]/g, ''))

    if (!Array.isArray(data)) {
      return {
        byCardId,
        byName,
        bySetCode,
        getSetInventory: () => null,
        getCardInventory: () => null,
        totalItems: 0,
      }
    }

    for (const card of data) {
      const qty = Number(card.quantity) || 1

      // 1. Índice por cardId
      if (card.cardId) {
        const idKey = String(card.cardId)
        const current = byCardId.get(idKey) || { quantity: 0, sets: new Set(), cards: [] }
        current.quantity += qty
        if (card.setCode) current.sets.add(card.setCode.trim().toUpperCase())
        current.cards.push(card)
        byCardId.set(idKey, current)
      }

      // 2. Índice por nombre normalizado
      if (card.name) {
        const nameKey = normName(card.name)
        if (nameKey) {
          const current = byName.get(nameKey) || { quantity: 0, sets: new Set(), cards: [] }
          current.quantity += qty
          if (card.setCode) current.sets.add(card.setCode.trim().toUpperCase())
          current.cards.push(card)
          byName.set(nameKey, current)
        }
      }

      // 3. Índice por setCode exacto (ej: MP16-EN057 o LOB-001)
      if (card.setCode) {
        const cleanCode = card.setCode.trim().toUpperCase()
        const current = bySetCode.get(cleanCode) || { quantity: 0, cards: [] }
        current.quantity += qty
        current.cards.push(card)
        bySetCode.set(cleanCode, current)

        // También indexar el prefijo sin sufijo de idioma si aplica (ej: LOB-001 vs LOB-EN001)
        const normalized = cleanCode.replace(/[^A-Z0-9]/g, '')
        if (normalized && !bySetCode.has(normalized)) {
          bySetCode.set(normalized, current)
        }
      }
    }

    return {
      byCardId,
      byName,
      bySetCode,
      /**
       * Verifica si un setCode exacto está en el inventario, opcionalmente filtrando por rareza específica.
       * @param {string} setCode
       * @param {string} [rarity]
       */
      getSetInventory: (setCode, rarity = null) => {
        if (!setCode) return null
        const clean = setCode.trim().toUpperCase()
        const norm = clean.replace(/[^A-Z0-9]/g, '')
        const entry = bySetCode.get(clean) || bySetCode.get(norm)
        if (!entry) return null
        if (!rarity) return entry
        const normRarity = rarity.trim().toLowerCase()
        const matchingCards = entry.cards.filter(c => c.rarity && c.rarity.trim().toLowerCase() === normRarity)
        if (matchingCards.length === 0) return null
        const rarityQty = matchingCards.reduce((acc, c) => acc + (Number(c.quantity) || 1), 0)
        return { quantity: rarityQty, cards: matchingCards }
      },
      /**
       * Verifica si una carta (por cardId o por nombre) está en el inventario.
       * @param {number|string} cardId
       * @param {string} [cardName]
       */
      getCardInventory: (cardId, cardName) => {
        if (cardId && byCardId.has(String(cardId))) {
          return byCardId.get(String(cardId))
        }
        if (cardName) {
          const key = normName(cardName)
          if (key && byName.has(key)) {
            return byName.get(key)
          }
        }
        return null
      },
      totalItems: data.length,
    }
  }, [data])

  return {
    ...lookup,
    isLoading,
  }
}
