/** Remove barra final e paths `/v1/...` se o usuário colar a URL de um endpoint. */
export function normalizeApiBaseUrl(url: string): string {
  const trimmed = url.trim().replace(/\/$/, '');
  return trimmed.replace(/\/v1\/.*$/i, '');
}
