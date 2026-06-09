import { describe, expect, it } from 'vitest';

import { normalizeApiBaseUrl } from '../lib/normalize-api-base-url';

describe('normalizeApiBaseUrl', () => {
  it('remove path /v1/... colado por engano', () => {
    expect(
      normalizeApiBaseUrl(
        'https://safe-qr-api-iw32tfemba-rj.a.run.app/v1/admin/stats',
      ),
    ).toBe('https://safe-qr-api-iw32tfemba-rj.a.run.app');
  });

  it('remove barra final', () => {
    expect(normalizeApiBaseUrl('http://localhost:3000/')).toBe('http://localhost:3000');
  });
});
