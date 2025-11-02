import React, { createContext, useContext, useReducer, ReactNode } from "react";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  // snapshot of product stock at the time item was added to cart
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
        return {
          items: state.items.map((i) => {
            if (i.id !== action.item.id) return i;
            // determine max allowed based on available stock snapshot
            const maxStock = action.item.stock ?? i.stock ?? Infinity;
            const newQty = Math.min(i.quantity + action.item.quantity, maxStock);
            return { ...i, quantity: newQty, stock: action.item.stock ?? i.stock };
          }),
        };
      }
      // new item: clamp initial quantity to stock if provided
      const initialStock = action.item.stock;
      const initialQty = initialStock !== undefined ? Math.min(action.item.quantity, initialStock) : action.item.quantity;
      return { items: [...state.items, { ...action.item, quantity: initialQty }] };
    }
    case "REMOVE":
      return { items: state.items.filter((i) => i.id !== action.id) };
    case "UPDATE":
      return {
        items: state.items.map((i) => {
          if (i.id !== action.id) return i;
          // clamp update to known stock snapshot (if available)
          const maxStock = i.stock ?? Infinity;
          const newQty = Math.min(action.quantity, maxStock);
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
