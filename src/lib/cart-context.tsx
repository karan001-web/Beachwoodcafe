import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from "react";
import { type MenuItem } from "./site-content";

export interface CartItem {
  item: MenuItem;
  quantity: number;
}

export interface CartContextType {
  items: CartItem[];
  totalCount: number;
  subtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (item: MenuItem, quantity?: number) => void;
  removeFromCart: (itemName: string) => void;
  updateQuantity: (itemName: string, quantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (itemName: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "beachwood_cart_v1";

// Helper to parse price string like "$18", "$6.50", "$14 / $52" into numeric value
export function parseItemPrice(priceStr: string): number {
  if (!priceStr) return 0;
  // If price has multiple tiers (e.g., "$14 / $52"), take the first one
  const firstPrice = priceStr.split("/")[0] ?? "";
  const cleaned = firstPrice.replace(/[^0-9.]/g, "");
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : val;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(CART_STORAGE_KEY);
        if (saved) {
          return JSON.parse(saved);
        }
      } catch (err) {
        console.error("Failed to load cart from localStorage", err);
      }
    }
    return [];
  });

  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  // Sync to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      } catch (err) {
        console.error("Failed to save cart to localStorage", err);
      }
    }
  }, [items]);

  const addToCart = (item: MenuItem, quantity: number = 1) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.item.name === item.name);
      if (existingIndex > -1 && prev[existingIndex]) {
        const updated = [...prev];
        const current = updated[existingIndex];
        if (current) {
          current.quantity += quantity;
        }
        return updated;
      }
      return [...prev, { item, quantity }];
    });
  };

  const removeFromCart = (itemName: string) => {
    setItems((prev) => prev.filter((i) => i.item.name !== itemName));
  };

  const updateQuantity = (itemName: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemName);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.item.name === itemName ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getItemQuantity = (itemName: string): number => {
    const found = items.find((i) => i.item.name === itemName);
    return found ? found.quantity : 0;
  };

  const totalCount = useMemo(() => {
    return items.reduce((acc, curr) => acc + curr.quantity, 0);
  }, [items]);

  const subtotal = useMemo(() => {
    return items.reduce((acc, curr) => {
      const price = parseItemPrice(curr.item.price);
      return acc + price * curr.quantity;
    }, 0);
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        totalCount,
        subtotal,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getItemQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
