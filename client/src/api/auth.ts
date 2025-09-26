import axiosInstance from './axiosInstance';
import { LoginPayload, RegisterPayload, User, AuthResponse } from '../types/user';

export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  try {
    const response = await axiosInstance.post('/auth/login', payload);
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.msg ||
      error.response?.data?.error ||
      'Login failed';
    throw new Error(errorMessage);
  }
}

export async function registerUser(payload: RegisterPayload): Promise<User> {
  try {
    const response = await axiosInstance.post('/auth/register', payload);
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.msg ||
      error.response?.data?.error ||
      'Register failed';
    throw new Error(errorMessage);
  }
}


export async function requestEmailVerification(email: string): Promise<{ msg: string }> {
  const response = await axiosInstance.post('/auth/request-verify-email', { email });
  return response.data;
}

export async function verifyEmail(token: string): Promise<{ msg: string }> {
  const response = await axiosInstance.get(`/auth/verify-email`, { params: { token } });
  return response.data;
}


