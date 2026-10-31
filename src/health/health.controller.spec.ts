import { ServiceUnavailableException } from '@nestjs/common';
import type { PrismaTransactionHost } from '../shared/infrastructure/database/prisma-transaction-host.js';
import { HealthController } from './health.controller.js';

function setup(queryRaw: () => Promise<unknown>) {
  const host = { client: { $queryRaw: queryRaw } };
  return new HealthController(host as unknown as PrismaTransactionHost);
}

describe('HealthController', () => {
  it('responde ok quando o banco responde', async () => {
    const controller = setup(() => Promise.resolve([{ '?column?': 1 }]));

    await expect(controller.check()).resolves.toEqual({ status: 'ok' });
  });

  it('responde 503 quando o banco não responde', async () => {
    const controller = setup(() =>
      Promise.reject(new Error('conexão recusada')),
    );

    await expect(controller.check()).rejects.toThrow(
      ServiceUnavailableException,
    );
  });
});
