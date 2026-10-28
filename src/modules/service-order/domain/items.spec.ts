import { Money } from '../../../shared/domain/money.js';
import { Quantity } from '../../../shared/domain/quantity.js';
import { PartItem } from './part-item.js';
import { ServiceItem } from './service-item.js';
import { InvalidServiceOrderError } from './service-order.errors.js';

const serviceItem = {
  serviceId: 'service-1',
  name: 'Alinhamento',
  price: Money.fromDecimal(89.9),
  quoteVersion: 1,
};

const partItem = {
  partId: 'part-1',
  name: 'Pastilha de freio dianteira',
  unitPrice: Money.fromDecimal(149.9),
  quantity: Quantity.of(2),
  quoteVersion: 1,
};

describe('ServiceItem', () => {
  it('guarda o nome e o preço do serviço no momento da inclusão', () => {
    const item = ServiceItem.create(serviceItem);

    expect(item.name).toBe('Alinhamento');
    expect(item.total.cents).toBe(8990);
    expect(item.quoteVersion).toBe(1);
  });

  it.each([0, -1, 1.5])('rejeita versão de orçamento %s', (quoteVersion) => {
    expect(() => ServiceItem.create({ ...serviceItem, quoteVersion })).toThrow(
      InvalidServiceOrderError,
    );
  });
});

describe('PartItem', () => {
  it('calcula o total pela quantidade e o preço unitário congelado', () => {
    const item = PartItem.create(partItem);

    expect(item.unitPrice.cents).toBe(14990);
    expect(item.total.cents).toBe(29980);
  });

  it('rejeita quantidade zero', () => {
    expect(() =>
      PartItem.create({ ...partItem, quantity: Quantity.zero() }),
    ).toThrow(InvalidServiceOrderError);
  });

  it('rejeita versão de orçamento inválida', () => {
    expect(() => PartItem.create({ ...partItem, quoteVersion: 0 })).toThrow(
      InvalidServiceOrderError,
    );
  });
});
