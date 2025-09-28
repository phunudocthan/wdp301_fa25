import axiosInstance from "./axiosInstance";
import type {
  LoginPayload,
  RegisterPayload,
  User,
  AuthResponse,
} from "../types/user";

type ApiMessage = { msg?: string; message?: string };

const getErrorMessage = (error: any, fallback: string) =>
  error?.response?.data?.msg ||
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallback;

export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  try {
    const response = await axiosInstance.post<AuthResponse>("/auth/login", payload);
    return response.data;
  } catch (error: any) {
    throw new Error(getErrorMessage(error, "Login failed"));
  }
}

export async function registerUser(payload: RegisterPayload): Promise<User> {
  try {
    const response = await axiosInstance.post<User>("/auth/register", payload);
    return response.data;
  } catch (error: any) {
    throw new Error(getErrorMessage(error, "Register failed"));
  }
}

export async function requestEmailVerification(email: string): Promise<ApiMessage> {
  const response = await axiosInstance.post<ApiMessage>("/auth/request-verify-email", { email });
  return response.data;
}

export async function resendVerificationEmail(email: string): Promise<ApiMessage> {
  const response = await axiosInstance.post<ApiMessage>("/auth/resend-verification-email", { email });
  return response.data;
}

export async function verifyEmail(token: string): Promise<ApiMessage> {
  const response = await axiosInstance.get<ApiMessage>("/auth/verify-email", { params: { token } });
  return response.data;
}

export async function requestPasswordReset(email: string): Promise<ApiMessage> {
  try {
    const response = await axiosInstance.post<ApiMessage>("/auth/forgot-password", { email });
    return response.data;
  } catch (error: any) {
    throw new Error(getErrorMessage(error, "Unable to send password reset email"));
  }
}

export async function resetPassword(token: string, password: string): Promise<ApiMessage> {
  try {
    const response = await axiosInstance.post<ApiMessage>(`/auth/reset-password/${token}`, { password });
    return response.data;
  } catch (error: any) {
    throw new Error(getErrorMessage(error, "Unable to reset password"));
  }
}
