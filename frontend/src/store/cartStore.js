import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) => {
        if (get().items.some((item) => item.id === product.id)) return;
        set((state) => ({
          items: [
            ...state.items,
            {
              id: product.id,
              title: product.title,
              price: product.price,
              overview_model_file: product.overview_model_file,
            },
          ],
        }));
      },

      removeItem: (productId) => {
        set((state) => ({ items: state.items.filter((item) => item.id !== productId) }));
      },

      clear: () => set({ items: [] }),

      isInCart: (productId) => get().items.some((item) => item.id === productId),
    }),
    { name: 'modelify-cart' }
  )
);
