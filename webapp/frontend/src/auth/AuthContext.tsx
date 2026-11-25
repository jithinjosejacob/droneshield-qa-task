import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { fetchMe, login as apiLogin, setToken, getToken } from '../api/client';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState>({} as AuthState);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (getToken()) {
        try {
          setUser(await fetchMe());
        } catch {
          setToken(null);
        }
      }
      setLoading(false);
    })();
  }, []);

  async function login(username: string, password: string) {
    const res = await apiLogin(username, password);
    setToken(res.access_token);
    setUser(await fetchMe());
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
