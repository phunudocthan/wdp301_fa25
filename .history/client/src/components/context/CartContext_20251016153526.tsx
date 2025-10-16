import React, { createContext, useContext, useReducer, ReactNode } from "react";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  // optional stock at time of adding to cart (client-side snapshot for UX)
  stock?: number;
}

interface CartState {
  items: CartItem[];
}

interface CartContextType {
  cart: CartState;
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function cartReducer(state: CartState, action: any): CartState {
  switch (action.type) {
    case "ADD": {
      const exists = state.items.find((i) => i.id === action.item.id);
      if (exists) {
        // If stock is provided, ensure we don't exceed it when incrementing
        const max = action.item.stock ?? exists.stock ?? undefined;
        return {
          items: state.items.map((i) =>
            i.id === action.item.id
              ? {
                  ...i,
                  // compute new quantity and clamp to max if defined
                  quantity: max !== undefined ? Math.min(i.quantity + action.item.quantity, max) : i.quantity + action.item.quantity,
                  // prefer the latest stock snapshot if provided
                  stock: action.item.stock ?? i.stock,
                }
              : i
          ),
        };
      }
      // If adding new item, ensure initial quantity is not greater than provided stock
      const initQty = action.item.quantity ?? 1;
      const clampedQty = action.item.stock !== undefined ? Math.min(initQty, action.item.stock) : initQty;
      return { items: [...state.items, { ...action.item, quantity: clampedQty }] };
    }
    case "REMOVE":
      return { items: state.items.filter((i) => i.id !== action.id) };
    case "UPDATE":
      return {
        items: state.items.map((i) => {
          if (i.id !== action.id) return i;
          const max = i.stock ?? undefined;
          const qty = action.quantity;
          const newQty = max !== undefined ? Math.min(qty, max) : qty;
          return { ...i, quantity: newQty };
        }),
      };
    case "CLEAR":
      return { items: [] };
    default:
      return state;
  }
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const initializer = () => {
    try {
      const raw = localStorage.getItem("cart");
      if (raw) return JSON.parse(raw);
    } catch (err) {
      console.warn("Failed to parse cart from localStorage", err);
    }
    return { items: [] } as CartState;
  };

  const [cart, dispatch] = useReducer(cartReducer, undefined, initializer);

  const addToCart = (item: CartItem) => {
    console.log("CartContext.addToCart ->", item);
    dispatch({ type: "ADD", item });
  };
  const removeFromCart = (id: string) => {
    dispatch({ type: "REMOVE", id });
  };
  const updateQuantity = (id: string, quantity: number) => {
    dispatch({ type: "UPDATE", id, quantity });
  };
  const clearCart = () => {
    dispatch({ type: "CLEAR" });
  };

  // Persist cart to localStorage whenever it changes
  React.useEffect(() => {
    try {
      localStorage.setItem("cart", JSON.stringify(cart));
    } catch (err) {
      console.warn("Failed to save cart to localStorage", err);
    }
  }, [cart]);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}
