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

export interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  booted: boolean;
  isAuthed: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthCtx = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [booted, setBooted] = useState(false);

  // Load user nếu có token
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

  // Login
  const login = async (email: string, password: string) => {
    const { token, user: u } = await api.login(email, password);
    storage.setToken(token);
    setUser(u);
    toast.success("Đăng nhập thành công");
  };

  // Register
  const register = async (name: string, email: string, password: string) => {
    await api.register(name, email, password);
    toast.success("Đăng ký thành công! Vui lòng đăng nhập.");
  };

  // Logout
  const logout = () => {
    storage.clearToken();
    setUser(null);
    toast.success("Đã đăng xuất");
  };

  const value: AuthContextType = useMemo(
    () => ({
      user,
      booted,
      isAuthed: !!user,
      login,
      register,
      logout,
    }),
    [user, booted]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
