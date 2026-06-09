import { z } from 'zod';

import { QrVerdict } from '../models/qr-verdict.js';

export const scanEventsListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  verdict: z.enum([QrVerdict.safe, QrVerdict.suspicious, QrVerdict.unsafe, QrVerdict.unknown]).optional(),
});

export const blocklistPostBodySchema = z.object({
  entry: z.string().trim().min(1).max(500),
});

export const blocklistDeleteBodySchema = z.object({
  entry: z.string().trim().min(1).max(500),
});
