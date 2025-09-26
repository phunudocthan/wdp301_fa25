import axiosInstance from './axiosInstance';
import type { User } from '../types/user';

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