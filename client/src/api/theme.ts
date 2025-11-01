import axiosInstance from "./axiosInstance";

/* =======================
   🧩 INTERFACES / TYPES
======================= */
export interface Theme {
  _id: string;
  name: string;
  description?: string;
  banner?: string;
  isActive: boolean;
  isPublished: boolean;
  previewUrl?: string;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ThemeCharacter {
  _id: string;
  name: string;
  image: string;
  themeId: string;
  description?: string;
  isActive: boolean;
  order: number;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  keyword?: string;
  isActive?: boolean;
  isPublished?: boolean;
}

export interface ThemeListResponse {
  data: Theme[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface ThemeDetailResponse {
  data: Theme & { characters: ThemeCharacter[] };
}

/* =======================
   🚀 API IMPLEMENTATION
======================= */
const themeApi = {
  /** ---------------- THEME ---------------- */

  // 📜 Lấy danh sách theme (phân trang, lọc, tìm kiếm) - Admin
  getAll: (params?: PaginationParams) =>
    axiosInstance.get<ThemeListResponse>("/themes", { params }),

  // 🌍 Lấy danh sách theme active (public)
  getActiveThemes: () => axiosInstance.get<ThemeListResponse>("/themes/active"),

  // 🔍 Lấy chi tiết 1 theme (kèm danh sách character)
  getById: (id: string) =>
    axiosInstance.get<ThemeDetailResponse>(`/themes/${id}`),

  // ➕ Tạo theme mới (upload banner)
  create: (formData: FormData) =>
    axiosInstance.post("/themes", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // ✏️ Cập nhật theme
  update: (id: string, formData: FormData) =>
    axiosInstance.put(`/themes/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // 🗑️ Xóa theme
  delete: (id: string) => axiosInstance.delete(`/themes/${id}`),

  // ⚙️ Đổi trạng thái active
  toggleActive: (id: string) =>
    axiosInstance.patch(`/themes/${id}/toggle-active`),

  /** ---------------- THEME CHARACTERS ---------------- */

  // 📜 Lấy danh sách nhân vật của theme
  getCharacters: (themeId: string, params?: PaginationParams) =>
    axiosInstance.get<{
      data: ThemeCharacter[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
      };
    }>(`/themes/${themeId}/characters`, { params }),

  // 🔍 Lấy chi tiết 1 nhân vật
  getCharacterById: (characterId: string) =>
    axiosInstance.get<{ data: ThemeCharacter }>(
      `/themes/characters/${characterId}`
    ),

  // ➕ Tạo nhân vật trong theme (upload ảnh)
  addCharacter: (themeId: string, formData: FormData) =>
    axiosInstance.post(`/themes/${themeId}/characters`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // ✏️ Cập nhật nhân vật
  updateCharacter: (characterId: string, formData: FormData) =>
    axiosInstance.put(`/themes/characters/${characterId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // 🗑️ Xóa nhân vật
  deleteCharacter: (characterId: string) =>
    axiosInstance.delete(`/themes/characters/${characterId}`),
};

export default themeApi;
