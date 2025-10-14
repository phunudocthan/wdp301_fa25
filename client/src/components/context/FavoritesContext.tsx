import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import {
  addFavorite as addFavoriteRequest,
  removeFavorite as removeFavoriteRequest,
  fetchFavorites,
  FavoriteProduct,
  FavoritesPayload,
} from "../../api/favorites";
import { useAuth } from "./AuthContext";
import { resolveAssetUrl } from "../../utils/assets";

interface FavoritesContextValue {
  favorites: FavoriteProduct[];
  favoriteIds: string[];
  loading: boolean;
  initialized: boolean;
  refreshFavorites: () => Promise<void>;
  addFavorite: (productId: string) => Promise<void>;
  removeFavorite: (productId: string) => Promise<void>;
  toggleFavorite: (productId: string) => Promise<boolean>;
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

const useStableAuth = () => {
  const { user, booted } = useAuth();
  return useMemo(() => ({ user, booted }), [user, booted]);
};

const normalizeFavorite = (favorite: FavoriteProduct): FavoriteProduct => ({
  ...favorite,
  images: Array.isArray(favorite.images)
    ? favorite.images.map((src) => resolveAssetUrl(src))
    : [],
});

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const { user, booted } = useStableAuth();
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const applyPayload = useCallback((payload: FavoritesPayload | undefined) => {
    if (!payload) {
      setFavorites([]);
      setFavoriteIds([]);
      return;
    }

    setFavorites(
      Array.isArray(payload.favorites)
        ? payload.favorites.map((item) => normalizeFavorite(item))
        : []
    );
    setFavoriteIds(
      Array.isArray(payload.favoriteIds) ? payload.favoriteIds : []
    );
  }, []);

  const refreshFavorites = useCallback(async () => {
    if (!user) {
      applyPayload(undefined);
      setInitialized(true);
      return;
    }

    setLoading(true);
    try {
      const payload = await fetchFavorites();
      applyPayload(payload);
    } catch (error) {
      console.error("Failed to fetch favourites", error);
      applyPayload(undefined);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, [user, applyPayload]);

  const addFavorite = useCallback(
    async (productId: string) => {
      if (!user) {
        throw new Error("Bạn cần đăng nhập để sử dụng danh sách yêu thích");
      }
      setLoading(true);
      try {
        const payload = await addFavoriteRequest(productId);
        applyPayload(payload);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    },
    [user, applyPayload]
  );

  const removeFavorite = useCallback(
    async (productId: string) => {
      if (!user) {
        throw new Error("Bạn cần đăng nhập để sử dụng danh sách yêu thích");
      }
      setLoading(true);
      try {
        const payload = await removeFavoriteRequest(productId);
        applyPayload(payload);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    },
    [user, applyPayload]
  );

  const toggleFavorite = useCallback(
    async (productId: string) => {
      const isFavorite = favoriteIds.includes(productId);
      if (isFavorite) {
        await removeFavorite(productId);
        return false;
      }
      await addFavorite(productId);
      return true;
    },
    [favoriteIds, addFavorite, removeFavorite]
  );

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      if (!booted) return;

      if (!user) {
        applyPayload(undefined);
        setInitialized(true);
        return;
      }

      setLoading(true);
      try {
        const payload = await fetchFavorites();
        if (!cancelled) {
          applyPayload(payload);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load favourites", error);
          applyPayload(undefined);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    boot();

    return () => {
      cancelled = true;
    };
  }, [booted, user, applyPayload]);

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favorites,
      favoriteIds,
      loading,
      initialized,
      refreshFavorites,
      addFavorite,
      removeFavorite,
      toggleFavorite,
    }),
    [
      favorites,
      favoriteIds,
      loading,
      initialized,
      refreshFavorites,
      addFavorite,
      removeFavorite,
      toggleFavorite,
    ]
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return ctx;
};
