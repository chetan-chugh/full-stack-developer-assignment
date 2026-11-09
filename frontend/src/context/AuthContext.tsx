import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { api, ApiError, tokenStore } from '../services/api';
import type { AuthResult, LoginInput, RegisterInput, User } from '../types';

export interface ChatMessage {
  from: 'user' | 'bot';
  text: string;
  isError?: boolean;
}

const initialChatMessages: ChatMessage[] = [
  { from: 'bot', text: 'Hi! Ask me something. Type "help" to see what I can do.' },
];

interface AuthContextType {
  user: User | null;
  loading: boolean;
  sessionError: boolean;
  chatMessages: ChatMessage[];
  chatSessionId: number;
  login: (credentials: LoginInput) => Promise<User>;
  register: (details: RegisterInput) => Promise<User>;
  logout: () => void;
  addChatMessage: (message: ChatMessage, sessionId: number) => void;
  updateUser: (user: User) => void;
  adminLogin: (credentials: LoginInput) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState(initialChatMessages);
  const chatSessionId = useRef(0);
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
    chatSessionId.current += 1;
    tokenStore.set(token);
    setUser(user);
    return user;
  };

  const value: AuthContextType = {
    user,
    loading,
    sessionError,
    chatMessages,
    chatSessionId: chatSessionId.current,
    updateUser: setUser,
    addChatMessage: (message, sessionId) => {
      if (sessionId === chatSessionId.current) {
        setChatMessages((messages) => [...messages, message]);
      }
    },
    login: async (credentials) => startSession(await api.login(credentials)),
    adminLogin: async (credentials) => startSession(await api.adminLogin(credentials)),
    register: async (details) => startSession(await api.register(details)),
    logout: () => {
      chatSessionId.current += 1;
      tokenStore.clear();
      setUser(null);
      setChatMessages(initialChatMessages);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}