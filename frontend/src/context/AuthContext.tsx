import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { api, ApiError, tokenStore } from '../services/api';
import type { AuthResult, LoginInput, RegisterInput, User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  sessionError: boolean;
  login: (credentials: LoginInput) => Promise<User>;
  register: (details: RegisterInput) => Promise<User>;
  logout: () => void;
  updateUser: (user: User) => void;
  adminLogin: (credentials: LoginInput) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // True when the saved token could not be checked because the server was unreachable
  const [sessionError, setSessionError] = useState(false);

  // Restore the session on page load
  useEffect(() => {
    if (!tokenStore.get()) {
      setLoading(false);
      return;
    }
    api
      .me()
      .then((data) => setUser(data.user))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) tokenStore.clear();
        else setSessionError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const startSession = ({ user, token }: AuthResult): User => {
    tokenStore.set(token);
    setUser(user);
    return user;
  };

  const value: AuthContextType = {
    user,
    loading,
    sessionError,
    updateUser: setUser,
    login: async (credentials) => startSession(await api.login(credentials)),
    adminLogin: async (credentials) => startSession(await api.adminLogin(credentials)),
    register: async (details) => startSession(await api.register(details)),
    logout: () => {
      tokenStore.clear();
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}