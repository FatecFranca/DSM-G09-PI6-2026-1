/** Host em minúsculas, sem `www.` inicial. */
export function normalizeHostname(host: string): string {
  let h = host.toLowerCase().trim();
  if (h.startsWith('www.')) {
    h = h.slice(4);
  }
  return h;
}

/**
 * Converte entrada da blocklist em padrão de comparação:
 * - URL ou domínio → hostname normalizado (`https://amaz0n.com.br/x` → `amaz0n.com.br`)
 * - palavra-chave → token em minúsculas (`amaz0n`, `magasine`)
 */
export function listEntryToBlockPattern(entry: string): string | null {
  const t = entry.trim().toLowerCase();
  if (!t) {
    return null;
  }

  const hostFromUrl = tryExtractHostname(t);
  if (hostFromUrl) {
    return normalizeHostname(hostFromUrl);
  }

  if (t.includes('.')) {
    const hostOnly = t.split('/')[0]?.split('?')[0]?.split('#')[0];
    if (hostOnly?.includes('.')) {
      return normalizeHostname(hostOnly);
    }
  }

  const keyword = t.replace(/[^a-z0-9-]/g, '');
  return keyword.length > 0 ? keyword : null;
}

/** @deprecated Use {@link listEntryToBlockPattern} — mantido para testes legados. */
export function listEntryToNormalizedHost(entry: string): string | null {
  return listEntryToBlockPattern(entry);
}

function tryExtractHostname(entry: string): string | null {
  try {
    const withScheme = entry.includes('://') ? entry : `https://${entry.split('/')[0]}`;
    const u = new URL(withScheme);
    return u.hostname || null;
  } catch {
    return null;
  }
}

/**
 * Correspondência da blocklist:
 * - domínio: exato, subdomínio ou variante com sufixo (`amaz0n.com.br` em `amaz0n.com.br2`)
 * - palavra-chave (sem `.`): presença no host (`amaz0n` em qualquer typosquat)
 */
export function hostnameMatchesBlocklist(normalizedHost: string, blocklist: Set<string>): boolean {
  if (!normalizedHost) {
    return false;
  }

  for (const pattern of blocklist) {
    if (!pattern) {
      continue;
    }
    if (normalizedHost === pattern) {
      return true;
    }
    if (normalizedHost.endsWith(`.${pattern}`)) {
      return true;
    }

    if (pattern.includes('.')) {
      if (domainPatternMatches(normalizedHost, pattern)) {
        return true;
      }
    } else if (pattern.length >= 3 && normalizedHost.includes(pattern)) {
      return true;
    }
  }
  return false;
}

/** Domínio: exato, subdomínio ou sufixo colado (ex.: `amaz0n.com.br2`). */
function domainPatternMatches(host: string, pattern: string): boolean {
  if (host === pattern) {
    return true;
  }
  if (host.endsWith(`.${pattern}`)) {
    return true;
  }
  if (host.startsWith(pattern) && host.length > pattern.length) {
    const next = host.charAt(pattern.length);
    return next !== '.';
  }
  return false;
}
