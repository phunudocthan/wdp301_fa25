export type UserRole = 'customer' | 'seller' | 'admin';
export type UserStatus = 'active' | 'inactive' | 'locked';

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
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
  createdAt?: string;
  updatedAt?: string;
  favoriteThemes?: string[];
  isVerified?: boolean;
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


