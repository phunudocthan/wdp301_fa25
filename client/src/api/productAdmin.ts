import axiosInstance from "./axiosInstance";

export interface Product {
  _id: string;
  name: string;
  themeId?: {
    _id: string;
    name: string;
  };
  ageRangeId?: {
    _id: string;
    rangeLabel: string;
    minAge?: number;
    maxAge?: number;
  };
  difficultyId?: {
    _id: string;
    label: string;
    level?: number;
  };
  pieces?: number;
  price: number;
  stock: number;
  status: "pending" | "active" | "inactive";
  images?: string[];
  categories?: {
    _id: string;
    name: string;
    slug: string;
  }[];
  createdBy?: {
    _id: string;
    username: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProductCreateData {
  name: string;
  themeId: string;
  ageRangeId: string;
  difficultyId: string;
  pieces?: number;
  price: number;
  stock?: number;
  status?: "pending" | "active" | "inactive";
  images?: string[];
  categories?: string[];
}

export interface ProductUpdateData extends Partial<ProductCreateData> {}

export interface ProductsResponse {
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

export interface ProductStatsResponse {
  success: boolean;
  data: {
    total: number;
    active: number;
    inactive: number;
    lowStock: number;
  };
}

class ProductAdminAPI {
  // Lấy danh sách sản phẩm với phân trang
  static async getProducts(
    params: {
      page?: number;
      limit?: number;
      search?: string;
      theme?: string;
      status?: string;
      category?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    } = {}
  ): Promise<ProductsResponse> {
    const response = await axiosInstance.get("/products/admin", { params });
    return response.data;
  }

  // Lấy chi tiết sản phẩm
  static async getProductById(id: string): Promise<Product> {
    const response = await axiosInstance.get(`/products/admin/${id}`);
    return response.data.data;
  }

  // Tạo sản phẩm mới
  static async createProduct(data: ProductCreateData): Promise<Product> {
    const response = await axiosInstance.post("/products/admin", data);
    return response.data.data;
  }

  // Cập nhật sản phẩm
  static async updateProduct(
    id: string,
    data: ProductUpdateData
  ): Promise<Product> {
    const response = await axiosInstance.put(`/products/admin/${id}`, data);
    return response.data.data;
  }

  // Xóa sản phẩm
  static async deleteProduct(id: string): Promise<void> {
    await axiosInstance.delete(`/products/admin/${id}`);
  }

  // Cập nhật trạng thái sản phẩm
  static async updateProductStatus(id: string, status: string): Promise<void> {
    await axiosInstance.patch(`/products/admin/${id}/status`, { status });
  }

  // Lấy thống kê sản phẩm
  static async getProductStats(): Promise<ProductStatsResponse> {
    const response = await axiosInstance.get("/products/admin/stats");
    return response.data;
  }
}

export default ProductAdminAPI;
