import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { api } from "../../lib/api";
import { storage } from "../../lib/storage";
import { toast } from "react-toastify";

// --------------------
// User interface
// --------------------
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;   // ✅ thêm avatar
  role?: string;     // admin | seller | customer
  status?: string;   // active | inactive | locked
  phone?: string;
}

// --------------------
// Auth context type
// --------------------
interface AuthContextType {
  user: User | null;
  booted: boolean;
  isAuthed: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthCtx = createContext<AuthContextType | undefined>(undefined);

// --------------------
// Provider
// --------------------
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [booted, setBooted] = useState(false);

  // Load user khi app mount
  useEffect(() => {
    (async () => {
      try {
        if (storage.getToken()) {
          const me = await api.me();
          setUser(me);
        }
      } catch {
        storage.clearToken();
      } finally {
        setBooted(true);
      }
    })();
  }, []);

  // --------------------
  // Methods
  // --------------------
  const login = async (email: string, password: string) => {
    const { token, user: u } = await api.login(email, password);
    storage.setToken(token);
    setUser(u);
    toast.success("Đăng nhập thành công!");
  };

  const register = async (name: string, email: string, password: string) => {
    await api.register(name, email, password);
    toast.success("Đăng ký thành công! Vui lòng đăng nhập.");
  };

  const logout = () => {
    storage.clearToken();
    setUser(null);
    toast.info("Bạn đã đăng xuất.");
  };

  const refreshUser = async () => {
    try {
      if (storage.getToken()) {
        const me = await api.me();
        setUser(me);
      }
    } catch {
      setUser(null);
      storage.clearToken();
    }
  };

  // --------------------
  // Context value
  // --------------------
  const value: AuthContextType = useMemo(
    () => ({
      user,
      booted,
      isAuthed: !!user,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, booted]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

// --------------------
// Hook
// --------------------
export const useAuth = () => {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
