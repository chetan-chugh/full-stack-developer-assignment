import type {
  ApiResponse,
  AuthResult,
  FieldErrors,
  LoginInput,
  LogsResponse,
  RegisterInput,
  User,
  UserChanges,
} from "../types";

const TOKEN_KEY = "token";

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

// An error that can also carry one message per form field and the HTTP status
export class ApiError extends Error {
  fieldErrors: FieldErrors;
  status: number;

  constructor(message: string, fieldErrors: FieldErrors = {}, status = 0) {
    super(message);
    this.fieldErrors = fieldErrors;
    this.status = status;
  }
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}

export function getFieldErrors(error: unknown): FieldErrors {
  return error instanceof ApiError ? error.fieldErrors : {};
}

// Thin fetch wrapper: adds the auth header and returns the "data" part of the response.
async function request<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const token = tokenStore.get();
  const headers: Record<string, string> = {};
  if (body) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const result = (await response.json().catch(() => ({}))) as ApiResponse<T>;
  if (!response.ok) {
    throw new ApiError(
      result.message || "Request failed",
      result.errors,
      response.status,
    );
  }
  return result.data;
}

export const api = {
  register: (body: RegisterInput) =>
    request<AuthResult>("/auth/register", "POST", body),
  login: (body: LoginInput) => request<AuthResult>("/auth/login", "POST", body),
  adminLogin: (body: LoginInput) =>
    request<AuthResult>("/auth/admin/login", "POST", body),
  me: () => request<{ user: User }>("/auth/me"),
  updateProfile: (body: { name: string }) =>
    request<{ user: User }>("/auth/me", "PATCH", body),
  changePassword: (body: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => request<null>("/auth/password", "PATCH", body),
  deleteAccount: () => request<null>("/auth/me", "DELETE"),
  sendMessage: (message: string) =>
    request<{ reply: string }>("/chat", "POST", { message }),
  getUsers: () => request<{ users: User[] }>("/admin/users"),
  updateUser: (id: string, body: UserChanges) =>
    request<{ user: User }>(`/admin/users/${id}`, "PATCH", body),
  deleteUser: (id: string) => request<void>(`/admin/users/${id}`, "DELETE"),
  getLogs: (page: number) =>
    request<LogsResponse>(`/admin/logs?page=${page}&limit=15`),
};