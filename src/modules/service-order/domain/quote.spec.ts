import { Money } from '../../../shared/domain/money.js';
import { Quantity } from '../../../shared/domain/quantity.js';
import { PartItem } from './part-item.js';
import { QuoteCalculator } from './quote-calculator.js';
import { Quote } from './quote.js';
import { ServiceItem } from './service-item.js';
import {
  InvalidServiceOrderError,
  QuoteAlreadyDecidedError,
} from './service-order.errors.js';

const generatedAt = new Date('2026-10-27T10:00:00Z');
const decidedAt = new Date('2026-10-27T11:00:00Z');
const pending = () => Quote.generate(1, Money.fromDecimal(329.8), generatedAt);

describe('Quote', () => {
  it('é gerada inicialmente pendente, com versão, total e data', () => {
    const quote = pending();

    expect(quote.version).toBe(1);
    expect(quote.total.cents).toBe(32980);
    expect(quote.generatedAt).toEqual(generatedAt);
    expect(quote.isPending).toBe(true);
    expect(quote.decision).toBeNull();
  });

  it('rejeita versão inválida', () => {
    expect(() => Quote.generate(0, Money.zero(), generatedAt)).toThrow(
      InvalidServiceOrderError,
    );
  });

  it('a aprovação devolve um novo orçamento, sem alterar o original', () => {
    const original = pending();

    const approved = original.approve(decidedAt);

    expect(approved.decision).toBe('APPROVED');
    expect(approved.decidedAt).toEqual(decidedAt);
    expect(approved.isPending).toBe(false);
    expect(original.isPending).toBe(true);
  });

  it('a rejeição registra o motivo, sem espaços nas pontas', () => {
    const rejected = pending().reject(decidedAt, '  Valor acima do esperado  ');

    expect(rejected.decision).toBe('REJECTED');
    expect(rejected.rejectionReason).toBe('Valor acima do esperado');
  });

  it.each([undefined, null, '   '])(
    'aceita rejeição sem motivo (%s)',
    (reason) => {
      expect(pending().reject(decidedAt, reason).rejectionReason).toBeNull();
    },
  );

  it.each<[string, (quote: Quote) => Quote]>([
    ['aprovar', (quote) => quote.approve(decidedAt)],
    ['rejeitar', (quote) => quote.reject(decidedAt)],
  ])('não deixa %s um orçamento já decidido', (_action, decide) => {
    const approved = pending().approve(decidedAt);

    expect(() => decide(approved)).toThrow(QuoteAlreadyDecidedError);
  });

  it('reconstitui o orçamento do banco', () => {
    const quote = Quote.restore({
      version: 2,
      total: Money.fromCents(5000),
      generatedAt,
      decision: 'REJECTED',
      decidedAt,
      rejectionReason: 'Sem dinheiro agora',
    });

    expect(quote.version).toBe(2);
    expect(quote.rejectionReason).toBe('Sem dinheiro agora');
  });
});

describe('QuoteCalculator', () => {
  it('soma serviços e peças (peça = preço unitário x quantidade)', () => {
    const items = [
      ServiceItem.create({
        serviceId: 'service-1',
        name: 'Revisão de freios',
        price: Money.fromDecimal(180),
        quoteVersion: 1,
      }),
      PartItem.create({
        partId: 'part-1',
        name: 'Pastilha de freio dianteira',
        unitPrice: Money.fromDecimal(149.9),
        quantity: Quantity.of(2),
        quoteVersion: 1,
      }),
    ];

    expect(QuoteCalculator.calculate(items).toDecimal()).toBe(479.8);
  });

  it('dá zero para uma lista vazia', () => {
    expect(QuoteCalculator.calculate([]).cents).toBe(0);
  });
});
