import axiosInstance from "./axiosInstance";

/* =======================
   🧩 INTERFACES / TYPES
======================= */
export interface Product {
  _id: string;
  name: string;
  price: number;
  stock: number;
  status: string;
  images: string[];
  pieces?: number;
  description?: string;
  themeId?: {
    _id: string;
    name: string;
  };
  characterId?: {
    _id: string;
    name: string;
    description?: string;
  };
  ageRangeId?: {
    _id: string;
    rangeLabel: string;
    minAge: number;
    maxAge: number;
  };
  difficultyId?: {
    _id: string;
    label: string;
    level: number;
  };
  categories?: Array<{
    _id: string;
    name: string;
    slug: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductListResponse {
  success: boolean;
  data: {
    products: Product[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalProducts: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

export interface ProductDetailResponse {
  success: boolean;
  data: Product;
}

export interface FilterParams {
  page?: number;
  limit?: number;
  search?: string;
  theme?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minPieces?: number;
  maxPieces?: number;
  ageRange?: string;
  difficulty?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/* =======================
   🚀 API IMPLEMENTATION
======================= */
const productApi = {
  // 📜 Lấy danh sách sản phẩm (có filter, search, sort)
  getAll: (params?: FilterParams) =>
    axiosInstance.get<ProductListResponse>("/products", { params }),

  // 🔍 Lấy chi tiết sản phẩm
  getById: (id: string) => axiosInstance.get<Product>(`/products/${id}`),

  // 🎨 Lấy sản phẩm theo theme
  getByTheme: (themeId: string) =>
    axiosInstance.get<{ success: boolean; data: Product[] }>(
      `/products/by-theme/${themeId}`
    ),

  // 👤 Lấy sản phẩm theo character
  getByCharacter: (characterId: string) =>
    axiosInstance.get<{ success: boolean; data: Product[] }>(
      `/products/by-character/${characterId}`
    ),

  // 🏆 Lấy sản phẩm bán chạy
  getBestSell: () =>
    axiosInstance.get<{ count: number; products: Product[] }>(
      "/products/best-sell"
    ),

  // 📂 Lấy sản phẩm theo category
  getByCategory: (categoryId: string) =>
    axiosInstance.get<Product[]>(`/products/category_list/${categoryId}`),

  // 🔧 Lấy metadata cho filters (themes, age ranges, difficulties)
  getFilterMeta: () =>
    axiosInstance.get<{
      success: boolean;
      data: {
        themes: Array<{ _id: string; name: string }>;
        ageRanges: Array<{
          _id: string;
          rangeLabel: string;
          minAge: number;
          maxAge: number;
        }>;
        difficulties: Array<{ _id: string; label: string; level: number }>;
      };
    }>("/products/filters/meta"),

  // 👁️ Lấy sản phẩm đã xem gần đây
  getRecentlyViewed: () =>
    axiosInstance.get<Product[]>("/products/recentlyViewedIds/view/recent"),
};

export default productApi;
