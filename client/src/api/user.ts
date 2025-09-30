import axiosInstance from './axiosInstance';
import type { User, UserAddress } from '../types/user';

// Lấy thông tin profile
export async function getProfile(): Promise<User> {
  const response = await axiosInstance.get('/users/profile');
  return response.data;
}

// Cập nhật profile
export async function updateProfile(data: Partial<User>): Promise<User> {
  const response = await axiosInstance.patch('/users/profile', data);
  return response.data;
}

// Cập nhật avatar
export async function updateAvatar(formData: FormData): Promise<User> {
  const response = await axiosInstance.put('/users/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

// Đổi mật khẩu
export async function changePassword(oldPassword: string, newPassword: string): Promise<{ msg: string }> {
  const response = await axiosInstance.put('/users/password', { oldPassword, newPassword });
  return response.data;
}
export interface AddressPayload extends Partial<UserAddress> {
  street: string;
  isDefault?: boolean;
}

export async function getAddresses(includeArchived = false): Promise<{ addresses: UserAddress[]; defaultAddress: UserAddress | null }> {
  const response = await axiosInstance.get('/users/addresses', { params: { includeArchived } });
  return {
    addresses: response.data.addresses || [],
    defaultAddress: response.data.defaultAddress || null,
  };
}

export async function createAddress(payload: AddressPayload): Promise<{ address: UserAddress; addresses: UserAddress[] }> {
  const response = await axiosInstance.post('/users/addresses', payload);
  return response.data;
}

export async function updateAddress(addressId: string, payload: Partial<AddressPayload> & { setAsDefault?: boolean }): Promise<{ address: UserAddress; addresses: UserAddress[] }> {
  const response = await axiosInstance.put(`/users/addresses/${addressId}`, payload);
  return response.data;
}

export async function setDefaultAddress(addressId: string): Promise<{ address: UserAddress; addresses: UserAddress[] }> {
  const response = await axiosInstance.patch(`/users/addresses/${addressId}/default`);
  return response.data;
}

export async function archiveAddress(addressId: string): Promise<{ addresses: UserAddress[] }> {
  const response = await axiosInstance.delete(`/users/addresses/${addressId}`);
  return response.data;
}
