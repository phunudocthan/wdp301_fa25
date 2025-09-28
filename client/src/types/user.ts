export type UserRole = 'customer' | 'seller' | 'admin';
export type UserStatus = 'active' | 'inactive' | 'locked';

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface UserAddress {
  _id?: string;
  label?: string;
  recipientName?: string;
  phone?: string;
  street: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  isDefault?: boolean;
  archived?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  _id?: string;
  name: string;
  email: string;
  password?: string;
  role?: UserRole;
  avatar?: string;
  phone?: string;
  address?: Address;
  status?: UserStatus;
  lastLogin?: string;
  lockUntil?: string;
  failedLoginAttempts?: number;
  createdAt?: string;
  updatedAt?: string;
  favoriteThemes?: string[];
  isVerified?: boolean;
  addresses?: UserAddress[];
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

