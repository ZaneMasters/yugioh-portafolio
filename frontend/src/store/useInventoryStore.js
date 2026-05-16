import { create } from 'zustand'

export const useInventoryStore = create((set) => ({
  cards: [],
  loading: false,
  setCards: (cards) => set({ cards }),
  setLoading: (loading) => set({ loading }),
  updateCardLocally: (id, payload) => set((state) => ({
    cards: state.cards.map((c) => (c.id === id ? { ...c, ...payload } : c)),
  })),
}))
