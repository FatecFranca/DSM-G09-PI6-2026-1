import { describe, expect, it } from 'vitest';

import {
  hostnameMatchesBlocklist,
  listEntryToBlockPattern,
  listEntryToNormalizedHost,
  normalizeHostname,
} from '../src/services/suspicious-hosts-match.js';

describe('suspicious-hosts-match', () => {
  it('normalizeHostname remove www', () => {
    expect(normalizeHostname('WWW.Example.COM')).toBe('example.com');
  });

  it('listEntryToNormalizedHost aceita URL completa', () => {
    expect(listEntryToNormalizedHost('https://amaz0n.com.br/x')).toBe('amaz0n.com.br');
  });

  it('hostnameMatchesBlocklist inclui subdomínio', () => {
    const s = new Set(['bad.com']);
    expect(hostnameMatchesBlocklist('pay.bad.com', s)).toBe(true);
    expect(hostnameMatchesBlocklist('bad.com', s)).toBe(true);
    expect(hostnameMatchesBlocklist('notbad.com', s)).toBe(false);
  });

  it('hostnameMatchesBlocklist bloqueia variante com sufixo no domínio', () => {
    const s = new Set(['amaz0n.com.br']);
    expect(hostnameMatchesBlocklist('amaz0n.com.br2', s)).toBe(true);
    expect(hostnameMatchesBlocklist('amaz0n.com.br', s)).toBe(true);
    expect(hostnameMatchesBlocklist('notamaz0n.com.br', s)).toBe(false);
  });

  it('hostnameMatchesBlocklist aceita palavra-chave (typosquat)', () => {
    const s = new Set(['amaz0n']);
    expect(hostnameMatchesBlocklist('amaz0n.com.br', s)).toBe(true);
    expect(hostnameMatchesBlocklist('amaz0n.com.br2', s)).toBe(true);
    expect(hostnameMatchesBlocklist('pay.fake-amaz0n-shop.com', s)).toBe(true);
    expect(hostnameMatchesBlocklist('amazon.com', s)).toBe(false);
  });

  it('listEntryToBlockPattern aceita palavra-chave pura', () => {
    expect(listEntryToBlockPattern('amaz0n')).toBe('amaz0n');
    expect(listEntryToBlockPattern('magasine')).toBe('magasine');
  });
});
