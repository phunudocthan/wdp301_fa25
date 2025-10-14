import axiosInstance from "./axiosInstance";

export interface RevenueSeries {
  labels: string[];
  data: number[];
  total: number;
}

export interface RevenueDashboardResponse {
  week: RevenueSeries;
  month: RevenueSeries;
  year: RevenueSeries;
}

export interface OrderStatusInfo {
  count: number;
  revenue: number;
}

export interface OrderDashboardResponse {
  totals: {
    orders: number;
    revenue: number;
  };
  statusBreakdown: Record<string, OrderStatusInfo>;
  recent: Array<{
    id: string;
    orderNumber?: string;
    status: string;
    total: number;
    paymentStatus: string;
    createdAt: string;
    customer: null | {
      id: string;
      name: string;
      email: string;
    };
  }>;
}

export interface AdminOverviewResponse {
  revenue: {
    last30Days: number;
  };
  orders: {
    orders: number;
    revenue: number;
    statusBreakdown: Record<string, OrderStatusInfo>;
  };
  users: {
    total: number;
    byStatus: Record<string, number>;
  };
}

export interface AdminUserListParams {
  page?: number;
  limit?: number;
  role?: string;
  status?: string;
  search?: string;
  sort?: string;
}

export interface AdminUserListResponse {
  users: Array<any>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface AdminUserDetailResponse {
  user: any;
  stats: {
    totalOrders: number;
    totalSpent: number;
    lastOrderAt: string | null;
  };
  recentOrders: Array<{
    _id: string;
    orderNumber?: string;
    status: string;
    total: number;
    createdAt: string;
    paymentStatus: string;
  }>;
}

export const adminApi = {
  getOverview: () =>
    axiosInstance
      .get<AdminOverviewResponse>("/admin/dashboard/overview")
      .then((res) => res.data),

  getRevenueDashboard: () =>
    axiosInstance
      .get<RevenueDashboardResponse>("/admin/dashboard/revenue")
      .then((res) => res.data),

  getOrderDashboard: () =>
    axiosInstance
      .get<OrderDashboardResponse>("/admin/dashboard/orders")
      .then((res) => res.data),

  listUsers: (params: AdminUserListParams = {}) =>
    axiosInstance
      .get<AdminUserListResponse>("/admin/users", { params })
      .then((res) => res.data),

  getUserDetail: (id: string) =>
    axiosInstance
      .get<AdminUserDetailResponse>(`/admin/users/${id}`)
      .then((res) => res.data),

  updateUserStatus: (id: string, action: "block" | "unblock") =>
    axiosInstance
      .patch(`/admin/users/${id}/status`, { action })
      .then((res) => res.data),
};

export type AdminApi = typeof adminApi;
