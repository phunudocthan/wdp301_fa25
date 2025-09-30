// lib/api.ts
import { http } from "./http";

export const api = {
  // �ang nh?p
  login: (email: string, password: string) =>
    http("/auth/login", {
      method: "POST",
      body: { email, password },
    }),

  // L?y th�ng tin user hi?n t?i
  me: () => http("/auth/me"),

  // �ang k� t�i kho?n
  register: (name: string, email: string, password: string, phone?: string) =>
    http("/auth/register", {
      method: "POST",
      body: {
        name,
        email,
        password,
        ...(phone ? { phone } : {}),
      },
    }),
};
