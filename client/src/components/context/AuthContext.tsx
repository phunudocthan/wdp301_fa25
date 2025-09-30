import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { toast } from "react-toastify";
import { api } from "../../lib/api";
import { storage } from "../../lib/storage";
import type { User as ApiUser } from "../../types/user";

const USER_STORAGE_KEY = "auth_user";

type AuthUser = ApiUser & { id?: string };

// --------------------
// Auth context type
// --------------------
interface AuthContextType {
  user: AuthUser | null;
  booted: boolean;
  isAuthed: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ token: string; role: string }>;
  googleLogin: (token: string) => Promise<{ token: string; role: string }>;
  register: (
    name: string,
    email: string,
    password: string,
    phone?: string
  ) => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
  updateUser: (user: AuthUser) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthCtx = createContext<AuthContextType | undefined>(undefined);

// --------------------
// Provider
// --------------------
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [booted, setBooted] = useState(false);

  const setAndPersistUser = useCallback((next: AuthUser | null) => {
    setUser(next);
    if (next) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(next));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const storedUser = localStorage.getItem(USER_STORAGE_KEY);
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }

        if (storage.getToken()) {
          const me = await api.me();
          setAndPersistUser(me);
        }
      } catch {
        storage.clearToken();
        setAndPersistUser(null);
      } finally {
        setBooted(true);
      }
    })();
  }, [setAndPersistUser]);

  // 🔹 Login thường
  // 🔹 Login thường
  const login = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ token: string; role: string }> => {
      const response = (await api.login(email, password)) as any;
      const { token, user, role } = response;

      console.log("Login response:", { token, user, role }); // Debug log

      storage.setToken(token);
      setAndPersistUser(user);
      toast.success("Đăng nhập thành công");

      // 👈 Trả cả token + role
      return { token, role };
    },
    [setAndPersistUser]
  );

  // 🔹 Login Google
  // 🔹 Login Google
  const googleLogin = useCallback(
    async (token: string): Promise<{ token: string; role: string }> => {
      const {
        token: jwtToken,
        user: loggedInUser,
        role,
      } = await api.googleLogin(token);

      storage.setToken(jwtToken);
      setAndPersistUser(loggedInUser);
      toast.success("Đăng nhập Google thành công");

      // 👈 Trả cả token + role
      return { token: jwtToken, role };
    },
    [setAndPersistUser]
  );

  const register = useCallback(
    async (name: string, email: string, password: string, phone?: string) => {
      await api.register(name, email, password, phone);
      toast.success("Đăng ký thành công! Vui lòng kiểm tra email để xác minh.");
    },
    []
  );

  const loginWithToken = useCallback(
    async (token: string) => {
      storage.setToken(token);
      const me = await api.me();
      setAndPersistUser(me);
      toast.success("Đăng nhập thành công");
    },
    [setAndPersistUser]
  );

  const updateUser = useCallback(
    (next: AuthUser) => {
      setAndPersistUser(next);
    },
    [setAndPersistUser]
  );

  const logout = useCallback(() => {
    storage.clearToken();
    setAndPersistUser(null);
    // Xóa các thông tin khác trong localStorage
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    localStorage.removeItem("avatar");
    toast.success("Đã đăng xuất thành công");
  }, [setAndPersistUser]);

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
      googleLogin,
      register,
      loginWithToken,
      updateUser,
      logout,
      refreshUser,
    }),
    [
      user,
      booted,
      login,
      googleLogin,
      register,
      loginWithToken,
      updateUser,
      logout,
    ]
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
