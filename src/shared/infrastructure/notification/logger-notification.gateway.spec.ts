import { Logger } from '@nestjs/common';
import { Money } from '../../domain/money.js';
import { LoggerNotificationGateway } from './logger-notification.gateway.js';

describe('LoggerNotificationGateway', () => {
  const gateway = new LoggerNotificationGateway();
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('registra o orçamento disponível com o total em reais', async () => {
    await gateway.quoteAvailable({
      customerId: 'customer-1',
      serviceOrderId: 'order-1',
      total: Money.fromDecimal(1234.56),
    });

    const message = logSpy.mock.calls[0]?.[0] as string;
    expect(message).toContain('order-1');
    expect(message).toMatch(/R\$\s1\.234,56/);
  });

  it('registra a OS finalizada', async () => {
    await gateway.serviceOrderFinished({
      customerId: 'customer-1',
      serviceOrderId: 'order-1',
    });

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('order-1'));
  });
});
