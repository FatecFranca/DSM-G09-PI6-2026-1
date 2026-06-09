import { normalizeApiBaseUrl } from '../lib/normalize-api-base-url';

const ADMIN_KEY_STORAGE = 'safe_qr_admin_key';
const API_URL_STORAGE = 'safe_qr_api_base_url';

export function loadAdminKey(): string | null {
  return sessionStorage.getItem(ADMIN_KEY_STORAGE);
}

export function saveAdminKey(key: string): void {
  sessionStorage.setItem(ADMIN_KEY_STORAGE, key.trim());
}

export function clearAdminKey(): void {
  sessionStorage.removeItem(ADMIN_KEY_STORAGE);
}

export function loadApiBaseUrl(): string {
  const stored = localStorage.getItem(API_URL_STORAGE);
  if (stored?.trim()) {
    return normalizeApiBaseUrl(stored);
  }
  return normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000');
}

export function saveApiBaseUrl(url: string): void {
  localStorage.setItem(API_URL_STORAGE, normalizeApiBaseUrl(url));
}

export function resolveAdminKey(fallback?: string): string {
  return loadAdminKey() ?? fallback ?? import.meta.env.VITE_ADMIN_API_KEY ?? '';
}
