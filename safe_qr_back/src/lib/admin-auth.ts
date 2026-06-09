import type { FastifyRequest } from 'fastify';

import type { Env } from '../config/env.js';

export type AdminAuthFailureReason = 'missing_key' | 'invalid_key' | 'not_configured';

export type AdminAuthResult =
  | { ok: true }
  | { ok: false; reason: AdminAuthFailureReason };

export function resolveAdminKey(req: FastifyRequest, env: Env): AdminAuthResult {
  const configuredKey = env.ADMIN_API_KEY?.trim();
  if (!configuredKey) {
    if (env.NODE_ENV === 'test') {
      return { ok: true };
    }
    return { ok: false, reason: 'not_configured' };
  }

  const header = req.headers['x-admin-key'];
  const provided = typeof header === 'string' ? header.trim() : '';
  if (!provided) {
    return { ok: false, reason: 'missing_key' };
  }
  if (provided !== configuredKey) {
    return { ok: false, reason: 'invalid_key' };
  }
  return { ok: true };
}

export function adminAuthStatusCode(reason: AdminAuthFailureReason): number {
  return reason === 'not_configured' ? 503 : 401;
}

export function adminAuthErrorMessage(reason: AdminAuthFailureReason): string {
  switch (reason) {
    case 'not_configured':
      return 'Painel admin não configurado no servidor (ADMIN_API_KEY ausente).';
    case 'missing_key':
      return 'Chave de admin ausente (header X-Admin-Key).';
    case 'invalid_key':
      return 'Chave de admin inválida.';
    default:
      return 'Não autorizado.';
  }
}
