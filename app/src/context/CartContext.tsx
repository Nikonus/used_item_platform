import { type ReactNode, createContext, useContext, useState, useCallback } from 'react'

type CartItem = {
  itemId: string
  title: string
  price: number
  currency: string
  thumbnailUrl: string | null
  sellerId: string
    sellerAddress: string
  sellerAddressLat: number
  sellerAddressLng: number
}

type CartContextValue = {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (itemId: string) => void
  clearCart: () => void
  itemCount: number
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([])

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      // Prevent duplicates
      if (prev.some((i) => i.itemId === item.itemId)) return prev
      return [...prev, item]
    })
  }, [])

  const removeItem = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((i) => i.itemId !== itemId))
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const value: CartContextValue = {
    items,
    addItem,
    removeItem,
    clearCart,
    itemCount: items.length,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error('useCart must be used within CartProvider')
  }
  return ctx
}
