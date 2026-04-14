import { create } from 'zustand'

export const useInventoryStore = create((set) => ({
  cards: [],
  loading: false,
  setCards: (cards) => set({ cards }),
  setLoading: (loading) => set({ loading }),
}))
