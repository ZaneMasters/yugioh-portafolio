import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { refreshCardPricePublic } from '../services/cardService'

export const getCardPrice = (card) => {
  if (!card) return null
  const priceVal =
    card.tcgMarketPrice ??
    (card.tcgPrice && card.tcgPrice !== '0.00' && card.tcgPrice !== '0' ? card.tcgPrice : null) ??
    (card.price && card.price !== '0.00' && card.price !== '0' ? card.price : null) ??
    (card.setPrice && card.setPrice !== '0.00' && card.setPrice !== '0' ? card.setPrice : null)

  if (priceVal !== null && priceVal !== undefined && priceVal !== '') {
    const num = Number(priceVal)
    return !isNaN(num) && num > 0 ? num : null
  }
  return null
}

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [], // Array de objetos { card, cartQuantity, isWishlist }
      
      updateCardPrice: (cardId, priceData) => {
        set((state) => ({
          items: state.items.map((item) => {
            if (item.card.id === cardId) {
              return {
                ...item,
                card: {
                  ...item.card,
                  tcgMarketPrice: priceData.tcgMarketPrice ?? item.card.tcgMarketPrice,
                  tcgLowPrice: priceData.tcgLowPrice ?? item.card.tcgLowPrice,
                  tcgPrice: priceData.tcgPrice ?? item.card.tcgPrice,
                  tcgPriceUpdatedAt: priceData.tcgPriceUpdatedAt ?? item.card.tcgPriceUpdatedAt,
                },
              }
            }
            return item
          }),
        }))
      },

      addItem: (card, isWishlist = false) => {
        // 1. Agregar inmediatamente al estado (UX instantánea, 0ms de espera)
        set((state) => {
          const existingItem = state.items.find(
            (item) => item.card.id === card.id && item.isWishlist === isWishlist
          )
          
          if (existingItem) {
            // Si ya existe, incrementar cantidad (si no supera el límite de inventario, excepto para wishlist)
            if (!isWishlist && existingItem.cartQuantity >= card.quantity) return state
            
            return {
              items: state.items.map((item) =>
                item.card.id === card.id && item.isWishlist === isWishlist
                  ? { ...item, cartQuantity: item.cartQuantity + 1 }
                  : item
              )
            }
          }
          
          // Si no existe, añadir con cantidad 1
          return { items: [...state.items, { card, cartQuantity: 1, isWishlist }] }
        })

        // 2. Consulta y actualización en segundo plano a TCGPlayer (solo si > 24h o sin precio)
        if (!isWishlist && card?.id && card?.setCode) {
          const DAY_MS = 24 * 60 * 60 * 1000
          const lastUpdated = card.tcgPriceUpdatedAt ? new Date(card.tcgPriceUpdatedAt).getTime() : 0
          const isOutdated = !lastUpdated || isNaN(lastUpdated) || (Date.now() - lastUpdated) >= DAY_MS || !card.tcgMarketPrice

          if (isOutdated) {
            refreshCardPricePublic(card.id)
              .then((res) => {
                const cardData = res?.data?.card || res?.card
                if (res?.data?.updated && cardData) {
                  get().updateCardPrice(card.id, cardData)
                }
              })
              .catch(() => {
                // Silencioso en segundo plano para no interrumpir la navegación del usuario
              })
          }
        }
      },
      
      removeItem: (cardId, isWishlist = false) => {
        set((state) => ({
          items: state.items.filter(
            (item) => !(item.card.id === cardId && item.isWishlist === isWishlist)
          )
        }))
      },
      
      updateQuantity: (cardId, quantity, isWishlist = false) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.card.id === cardId && item.isWishlist === isWishlist
              ? { ...item, cartQuantity: quantity }
              : item
          )
        }))
      },
      
      clearCart: () => set({ items: [] }),
      
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.cartQuantity, 0)
      },

      getTotalPrice: () => {
        return get().items
          .filter((item) => !item.isWishlist)
          .reduce((total, item) => {
            const price = getCardPrice(item.card)
            return price !== null ? total + price * item.cartQuantity : total
          }, 0)
      }
    }),
    {
      name: 'yugioh-cart-storage', // key in localStorage
    }
  )
)

