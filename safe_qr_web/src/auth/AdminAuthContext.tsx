import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { createApiClient, type ApiClient } from '../api/client';
import {
  clearAdminKey,
  loadApiBaseUrl,
  resolveAdminKey,
  saveAdminKey,
  saveApiBaseUrl,
} from './storage';

type AdminAuthContextValue = {
  apiBaseUrl: string;
  isAuthenticated: boolean;
  api: ApiClient | null;
  login: (apiBaseUrl: string, adminKey: string) => void;
  logout: () => void;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [apiBaseUrl, setApiBaseUrl] = useState(loadApiBaseUrl);
  const [adminKey, setAdminKey] = useState(() => resolveAdminKey());

  const login = useCallback((url: string, key: string) => {
    const normalizedUrl = url.trim().replace(/\/$/, '');
    const normalizedKey = key.trim();
    saveApiBaseUrl(normalizedUrl);
    saveAdminKey(normalizedKey);
    setApiBaseUrl(normalizedUrl);
    setAdminKey(normalizedKey);
  }, []);

  const logout = useCallback(() => {
    clearAdminKey();
    setAdminKey('');
  }, []);

  const api = useMemo(() => {
    if (!adminKey) return null;
    return createApiClient({ baseUrl: apiBaseUrl, adminKey });
  }, [apiBaseUrl, adminKey]);

  const value = useMemo(
    () => ({
      apiBaseUrl,
      isAuthenticated: Boolean(adminKey),
      api,
      login,
      logout,
    }),
    [apiBaseUrl, adminKey, api, login, logout],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return ctx;
}
