import { describe, expect, it } from 'vitest';

import { clampPage, slicePage } from '../lib/pagination';

describe('clampPage', () => {
  it('mantém página válida', () => {
    expect(clampPage(1, 26, 10)).toBe(1);
  });

  it('corrige página acima do máximo', () => {
    expect(clampPage(5, 26, 10)).toBe(2);
  });

  it('corrige página negativa', () => {
    expect(clampPage(-1, 26, 10)).toBe(0);
  });
});

describe('slicePage', () => {
  const items = Array.from({ length: 26 }, (_, i) => `item-${i}`);

  it('retorna fatia da página 0', () => {
    expect(slicePage(items, 0, 10)).toHaveLength(10);
    expect(slicePage(items, 0, 10)[0]).toBe('item-0');
  });

  it('retorna fatia da página 2', () => {
    expect(slicePage(items, 2, 10)).toHaveLength(6);
    expect(slicePage(items, 2, 10)[0]).toBe('item-20');
  });
});
