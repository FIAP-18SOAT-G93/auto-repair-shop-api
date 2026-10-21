import type { PrismaService } from './prisma.service.js';
import { PrismaTransactionHost } from './prisma-transaction-host.js';
import { PrismaUnitOfWork } from './prisma-unit-of-work.js';

function setup() {
  const tx = { label: 'transaction-client' };
  const transaction = vi.fn(async (fn: (client: unknown) => Promise<unknown>) =>
    fn(tx),
  );
  const prisma = { $transaction: transaction } as unknown as PrismaService;
  const host = new PrismaTransactionHost(prisma);
  const unitOfWork = new PrismaUnitOfWork(prisma, host);
  return { tx, prisma, transaction, host, unitOfWork };
}

describe('PrismaUnitOfWork', () => {
  it('fora de uma transação, entrega o PrismaService', () => {
    const { prisma, host } = setup();
    expect(host.client).toBe(prisma);
  });

  it('dentro de run(), entrega o cliente da transação', async () => {
    const { tx, host, unitOfWork } = setup();

    const clientInside = await unitOfWork.run(async () => host.client);

    expect(clientInside).toBe(tx);
  });

  it('volta a entregar o PrismaService depois que run() termina', async () => {
    const { prisma, host, unitOfWork } = setup();

    await unitOfWork.run(async () => undefined);

    expect(host.client).toBe(prisma);
  });

  it('reaproveita a transação em andamento quando run() é chamado dentro de run()', async () => {
    const { tx, transaction, host, unitOfWork } = setup();

    const clientInside = await unitOfWork.run(() =>
      unitOfWork.run(async () => host.client),
    );

    expect(clientInside).toBe(tx);
    expect(transaction).toHaveBeenCalledTimes(1);
  });

  it('propaga o erro do trabalho, o que faz o Prisma desfazer a transação', async () => {
    const { unitOfWork } = setup();

    await expect(
      unitOfWork.run(async () => {
        throw new Error('falhou');
      }),
    ).rejects.toThrow('falhou');
  });
});
