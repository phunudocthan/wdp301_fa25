import axiosInstance from "./axiosInstance";

export interface Category {
  _id: string;
  name: string;
  description?: string;
  slug: string;
  image?: string;
  parentId?: string;
  isActive: boolean;
  order: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  subcategories?: Category[];
  productCount?: number;
}

export interface CategoryQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  isActive?: boolean;
  parentId?: string;
}

export interface CategoryStats {
  totalCategories: number;
  activeCategories: number;
  parentCategories: number;
  subcategories: number;
}

export interface CategoryResponse {
  data: Category[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const categoryAdminAPI = {
  // Get all categories with pagination and filters
  getCategories: async (
    params: CategoryQuery = {}
  ): Promise<CategoryResponse> => {
    const response = await axiosInstance.get("/categories", { params });
    return response.data;
  },

  // Get category by ID
  getCategoryById: async (id: string): Promise<{ data: Category }> => {
    const response = await axiosInstance.get(`/categories/${id}`);
    return response.data;
  },

  // Create new category
  createCategory: async (
    categoryData: FormData
  ): Promise<{ data: Category; message: string }> => {
    const response = await axiosInstance.post("/categories", categoryData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Update category
  updateCategory: async (
    id: string,
    categoryData: FormData
  ): Promise<{ data: Category; message: string }> => {
    const response = await axiosInstance.put(
      `/categories/${id}`,
      categoryData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  // Delete category
  deleteCategory: async (id: string): Promise<{ message: string }> => {
    const response = await axiosInstance.delete(`/categories/${id}`);
    return response.data;
  },

  // Toggle category status
  toggleCategoryStatus: async (
    id: string,
    isActive: boolean
  ): Promise<{ message: string; data: { isActive: boolean } }> => {
    const response = await axiosInstance.patch(
      `/categories/${id}/toggle-status`,
      { isActive }
    );
    return response.data;
  },

  // Get category tree (hierarchical structure)
  getCategoryTree: async (): Promise<{ data: Category[] }> => {
    const response = await axiosInstance.get("/categories/tree");
    return response.data;
  },

  // Get category statistics
  getCategoryStats: async (): Promise<{ data: CategoryStats }> => {
    const response = await axiosInstance.get("/categories/stats");
    return response.data;
  },
};

export default categoryAdminAPI;
