// src/types/index.ts
export type Role = 'user' | 'admin';

// One error message per form field, for example { email: 'Email is required' }
export type FieldErrors = Record<string, string>;

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UsageLog {
  _id: string;
  action: string;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
  user: { _id: string; email: string } | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: FieldErrors;
}

export interface AuthResult {
  user: User;
  token: string;
}

export interface LogsResponse {
  logs: UsageLog[];
  total: number;
  page: number;
  pages: number;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  name: string;
  confirmPassword: string;
}

export type UserChanges = Partial<Pick<User, 'name' | 'role' | 'isActive'>>;