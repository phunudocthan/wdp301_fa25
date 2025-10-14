import axiosInstance from "./axiosInstance";

export interface FavoriteCategory {
  id?: string;
  name?: string;
  slug?: string;
}

export interface FavoriteTheme {
  id?: string;
  name?: string;
}

export interface FavoriteProduct {
  id: string;
  name: string;
  price?: number;
  images: string[];
  status?: string;
  stock?: number;
  pieces?: number;
  theme?: FavoriteTheme | null;
  categories: FavoriteCategory[];
  createdAt?: string;
  updatedAt?: string;
}

export interface FavoritesPayload {
  favorites: FavoriteProduct[];
  favoriteIds: string[];
  message?: string;
}

export const fetchFavorites = async (): Promise<FavoritesPayload> => {
  const response = await axiosInstance.get<FavoritesPayload>("/users/favorites");
  return response.data;
};

export const addFavorite = async (
  productId: string
): Promise<FavoritesPayload> => {
  const response = await axiosInstance.post<FavoritesPayload>(
    `/users/favorites/${productId}`
  );
  return response.data;
};

export const removeFavorite = async (
  productId: string
): Promise<FavoritesPayload> => {
  const response = await axiosInstance.delete<FavoritesPayload>(
    `/users/favorites/${productId}`
  );
  return response.data;
};
