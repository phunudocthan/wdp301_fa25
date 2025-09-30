// lib/api.ts
import { http } from "./http";

export const api = {
  // Đăng nhập
  login: (email: string, password: string) =>
    http("/auth/login", {
      method: "POST",
      body: { email, password },
    }),

  // Lấy thông tin user hiện tại
  me: () => http("/auth/me"),

  // Đăng ký tài khoản
  register: (name: string, email: string, password: string) =>
    http("/auth/register", {
      method: "POST",
      body: { name, email, password },
    }),
};
