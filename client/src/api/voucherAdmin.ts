import axiosInstance from './axiosInstance';

export interface Voucher {
  _id: string;
  code: string;
  discountPercent: number;
  expiryDate: string;
  usageLimit: number;
  status: 'active' | 'expired' | 'disabled';
  createdAt: string;
  updatedAt: string;
}

export interface VouchersResponse {
  success: boolean;
  data: {
    vouchers: Voucher[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalVouchers: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

class VoucherAdminAPI {
  static async getVouchers(params: { page?: number; limit?: number; search?: string; status?: string } = {}): Promise<VouchersResponse> {
    const response = await axiosInstance.get('/vouchers/admin', { params });
    return response.data;
  }

  static async getVoucherById(id: string): Promise<Voucher> {
    const response = await axiosInstance.get(`/vouchers/admin/${id}`);
    return response.data.data;
  }

  static async createVoucher(data: Partial<Voucher>): Promise<Voucher> {
    const response = await axiosInstance.post('/vouchers/admin', data);
    return response.data.data;
  }

  static async updateVoucher(id: string, data: Partial<Voucher>): Promise<Voucher> {
    const response = await axiosInstance.put(`/vouchers/admin/${id}`, data);
    return response.data.data;
  }

  static async deleteVoucher(id: string): Promise<void> {
    await axiosInstance.delete(`/vouchers/admin/${id}`);
  }

  static async updateVoucherStatus(id: string, status: string): Promise<Voucher> {
    const response = await axiosInstance.patch(`/vouchers/admin/${id}/status`, { status });
    return response.data.data;
  }
}

export default VoucherAdminAPI;
