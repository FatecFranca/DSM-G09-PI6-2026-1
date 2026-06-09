import { describe, expect, it } from 'vitest';

import { formatDateTime, formatNumber, shortenUserId, truncateMiddle } from '../lib/format';

describe('format', () => {
  it('formatDateTime formata ISO em pt-BR', () => {
    const result = formatDateTime('2026-06-08T20:00:00.000Z');
    expect(result).toMatch(/08\/06\/2026/);
  });

  it('formatNumber usa separador de milhar', () => {
    expect(formatNumber(1234)).toMatch(/1\.234|1,234/);
  });

  it('truncateMiddle encurta strings longas', () => {
    expect(truncateMiddle('abcdefghijklmnop', 10)).toBe('abcd…mnop');
  });

  it('shortenUserId trunca UIDs longos', () => {
    expect(shortenUserId('Vb3ubOjy9RYt9AKpx3VzunBirEc2')).toMatch(/…/);
    expect(shortenUserId(null)).toBe('—');
  });
});
