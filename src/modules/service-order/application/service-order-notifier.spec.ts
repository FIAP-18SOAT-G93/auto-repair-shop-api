import { Logger } from '@nestjs/common';
import { Money } from '../../../shared/domain/money.js';
import {
  QuoteApproved,
  QuoteGenerated,
  ServiceOrderDelivered,
  ServiceOrderFinished,
  ServiceOrderOpened,
} from '../domain/service-order.events.js';
import { FakeNotificationGateway } from '../testing/fakes.js';
import { ServiceOrderNotifier } from './service-order-notifier.js';

const now = new Date('2026-10-29T10:00:00Z');

function setup() {
  const gateway = new FakeNotificationGateway();
  return { gateway, notifier: new ServiceOrderNotifier(gateway) };
}

describe('ServiceOrderNotifier', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('avisa o cliente quando o orçamento é gerado', async () => {
    const { gateway, notifier } = setup();

    await notifier.notify('customer-1', [
      new QuoteGenerated('order-1', 1, Money.fromDecimal(389.7), now),
    ]);

    expect(gateway.quotesAvailable).toHaveLength(1);
    expect(gateway.quotesAvailable[0]).toMatchObject({
      customerId: 'customer-1',
      serviceOrderId: 'order-1',
    });
    expect(gateway.quotesAvailable[0]?.total.cents).toBe(38970);
  });

  it('avisa o cliente quando a OS é finalizada', async () => {
    const { gateway, notifier } = setup();

    await notifier.notify('customer-1', [
      new ServiceOrderFinished('order-1', now),
    ]);

    expect(gateway.ordersFinished).toEqual([
      { customerId: 'customer-1', serviceOrderId: 'order-1' },
    ]);
  });

  it('não avisa sobre eventos que não interessam ao cliente', async () => {
    const { gateway, notifier } = setup();

    await notifier.notify('customer-1', [
      new ServiceOrderOpened('order-1', 1, 'customer-1', 'vehicle-1', now),
      new QuoteApproved('order-1', 1, now),
      new ServiceOrderDelivered('order-1', now),
    ]);

    expect(gateway.quotesAvailable).toHaveLength(0);
    expect(gateway.ordersFinished).toHaveLength(0);
  });

  it('uma falha no canal é registrada e não impede os próximos avisos', async () => {
    const { gateway, notifier } = setup();
    vi.spyOn(gateway, 'quoteAvailable').mockRejectedValueOnce(
      new Error('canal fora do ar'),
    );

    await expect(
      notifier.notify('customer-1', [
        new QuoteGenerated('order-1', 1, Money.fromDecimal(389.7), now),
        new ServiceOrderFinished('order-1', now),
      ]),
    ).resolves.toBeUndefined();

    expect(gateway.ordersFinished).toHaveLength(1);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('canal fora do ar'),
    );
  });
});
