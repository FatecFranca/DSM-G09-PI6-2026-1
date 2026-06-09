import type { FastifyReply, FastifyRequest } from 'fastify';

import type { Env } from '../config/env.js';
import {
  adminAuthErrorMessage,
  adminAuthStatusCode,
  resolveAdminKey,
} from '../lib/admin-auth.js';
import {
  blocklistDeleteBodySchema,
  blocklistListQuerySchema,
  blocklistPostBodySchema,
  scanEventsListQuerySchema,
} from '../schemas/admin.schema.js';
import type { BlocklistService } from '../services/blocklist.service.js';
import type { ScanEventService } from '../services/scan-event.service.js';
import {
  notFoundError,
  unauthorizedError,
  validationError,
} from '../views/error-response.view.js';
import {
  toAdminStatsResponseJson,
  toBlocklistMutationResponseJson,
  toBlocklistResponseJson,
  toScanEventsListResponseJson,
} from '../views/admin-response.view.js';

type AdminControllerDeps = {
  env: Env;
  scanEvents: ScanEventService;
  blocklist: BlocklistService;
  apiVersion: string;
};

export class AdminController {
  constructor(private readonly deps: AdminControllerDeps) {}

  private assertAdmin(req: FastifyRequest, reply: FastifyReply): boolean {
    const auth = resolveAdminKey(req, this.deps.env);
    if (auth.ok) {
      return true;
    }
    reply
      .status(adminAuthStatusCode(auth.reason))
      .send(unauthorizedError(req.id, adminAuthErrorMessage(auth.reason)));
    return false;
  }

  getStats = async (req: FastifyRequest, reply: FastifyReply) => {
    if (!this.assertAdmin(req, reply)) {
      return;
    }

    const [scanEvents, blocklist] = await Promise.all([
      this.deps.scanEvents.stats(),
      this.deps.blocklist.list(),
    ]);

    return reply.send(
      toAdminStatsResponseJson({
        scanEvents,
        blocklist,
        api: {
          status: 'ok',
          service: 'safe-qr-api',
          version: this.deps.apiVersion,
        },
      }),
    );
  };

  getScanEvents = async (req: FastifyRequest, reply: FastifyReply) => {
    if (!this.assertAdmin(req, reply)) {
      return;
    }

    const parsed = scanEventsListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send(
        validationError(req.id, 'Query inválida.', parsed.error.flatten()),
      );
    }

    const result = await this.deps.scanEvents.list(parsed.data);
    return reply.send(toScanEventsListResponseJson(result));
  };

  getBlocklist = async (req: FastifyRequest, reply: FastifyReply) => {
    if (!this.assertAdmin(req, reply)) {
      return;
    }

    const parsed = blocklistListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send(
        validationError(req.id, 'Query inválida.', parsed.error.flatten()),
      );
    }

    const result = await this.deps.blocklist.list(parsed.data);
    return reply.send(toBlocklistResponseJson(result));
  };

  postBlocklist = async (req: FastifyRequest, reply: FastifyReply) => {
    if (!this.assertAdmin(req, reply)) {
      return;
    }

    const parsed = blocklistPostBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send(
        validationError(req.id, 'Corpo inválido.', parsed.error.flatten()),
      );
    }

    const { entry } = parsed.data;
    const result = await this.deps.blocklist.add(entry);

    req.log.info({ event: 'blocklist_add', entry, added: result.added }, 'Blocklist add');

    return reply.status(result.added ? 201 : 200).send(
      toBlocklistMutationResponseJson({
        entry,
        action: result.added ? 'added' : 'unchanged',
      }),
    );
  };

  deleteBlocklist = async (req: FastifyRequest, reply: FastifyReply) => {
    if (!this.assertAdmin(req, reply)) {
      return;
    }

    const parsed = blocklistDeleteBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send(
        validationError(req.id, 'Corpo inválido.', parsed.error.flatten()),
      );
    }

    const { entry } = parsed.data;
    const result = await this.deps.blocklist.remove(entry);
    if (!result.removed) {
      return reply.status(404).send(notFoundError(req.id, 'Entrada não encontrada na blocklist.'));
    }

    req.log.info({ event: 'blocklist_remove', entry }, 'Blocklist remove');
    return reply.send(toBlocklistMutationResponseJson({ entry, action: 'removed' }));
  };
}
