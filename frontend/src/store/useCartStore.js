import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [], // Array de objetos { card, cartQuantity, isWishlist }
      
      addItem: (card, isWishlist = false) => {
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
      }
    }),
    {
      name: 'yugioh-cart-storage', // key in localStorage
    }
  )
)
