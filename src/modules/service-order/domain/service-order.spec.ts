import { Money } from '../../../shared/domain/money.js';
import { Quantity } from '../../../shared/domain/quantity.js';
import {
  InvalidServiceOrderError,
  QuoteVersionMismatchError,
  ServiceOrderActionNotAllowedError,
  ServiceOrderWithoutItemsError,
} from './service-order.errors.js';
import {
  QuoteApproved,
  QuoteGenerated,
  QuoteRejected,
  ServiceOrderDelivered,
  ServiceOrderFinished,
  ServiceOrderOpened,
} from './service-order.events.js';
import { ServiceOrder } from './service-order.js';
import { StatusHistory } from './status-history.js';

const at = (time: string) => new Date(`2026-10-27T${time}:00Z`);
const HOUR = 60 * 60 * 1000;

const alignment = {
  serviceId: 'service-alignment',
  name: 'Alinhamento',
  price: Money.fromDecimal(89.9),
};
const brakeReview = {
  serviceId: 'service-brakes',
  name: 'Revisão de freios',
  price: Money.fromDecimal(180),
};
const brakePads = {
  partId: 'part-pads',
  name: 'Pastilha de freio dianteira',
  unitPrice: Money.fromDecimal(149.9),
  quantity: Quantity.of(2),
};
const brakeFluid = {
  partId: 'part-fluid',
  name: 'Fluido de freio DOT 4',
  unitPrice: Money.fromDecimal(32),
  quantity: Quantity.of(1),
};

const opened = () =>
  ServiceOrder.open(
    { number: 1042, customerId: 'customer-1', vehicleId: 'vehicle-1' },
    at('08:00'),
  );

function inDiagnosis(): ServiceOrder {
  const order = opened();
  order.startDiagnosis(at('09:00'));
  return order;
}

function awaitingApproval(): ServiceOrder {
  const order = inDiagnosis();
  order.addService(alignment);
  order.addPart(brakePads);
  order.concludeDiagnosis(at('10:00'));
  return order;
}

function inExecution(): ServiceOrder {
  const order = awaitingApproval();
  order.approve(1, at('11:00'));
  return order;
}

function finished(): ServiceOrder {
  const order = inExecution();
  order.finish(at('13:00'));
  return order;
}

const eventsOf = (order: ServiceOrder) =>
  order.pullDomainEvents().map((event) => event.eventName);

describe('ServiceOrder', () => {
  describe('abertura', () => {
    it('abre a OS como Recebida, ligada ao cliente e ao veículo', () => {
      const order = opened();

      expect(order.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(order.number).toBe(1042);
      expect(order.status).toBe('RECEIVED');
      expect(order.customerId).toBe('customer-1');
      expect(order.vehicleId).toBe('vehicle-1');
      expect(order.openedAt).toEqual(at('08:00'));
      expect(order.isOpen).toBe(true);
      expect(order.currentQuote).toBeNull();
    });

    it('registra o evento ServiceOrderOpened, entregue uma única vez', () => {
      const order = opened();

      const events = order.pullDomainEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(ServiceOrderOpened);
      expect(order.pullDomainEvents()).toHaveLength(0);
    });

    it.each([0, -1, 1.5])('rejeita número de OS %s', (number) => {
      expect(() =>
        ServiceOrder.open(
          { number, customerId: 'customer-1', vehicleId: 'vehicle-1' },
          at('08:00'),
        ),
      ).toThrow(InvalidServiceOrderError);
    });
  });

  describe('diagnóstico', () => {
    it('inicia o diagnóstico de uma OS recebida', () => {
      const order = inDiagnosis();

      expect(order.status).toBe('IN_DIAGNOSIS');
      expect(order.history.entries).toHaveLength(2);
    });

    it('não inicia o diagnóstico duas vezes', () => {
      expect(() => inDiagnosis().startDiagnosis(at('09:30'))).toThrow(
        ServiceOrderActionNotAllowedError,
      );
    });

    it('inclui serviços e peças com o preço congelado na versão 1', () => {
      const order = inDiagnosis();

      order.addService(alignment);
      order.addPart(brakePads);

      expect(order.serviceItems[0]).toMatchObject({
        name: 'Alinhamento',
        quoteVersion: 1,
      });
      expect(order.partItems[0]?.total.cents).toBe(29980);
      expect(order.partItems[0]?.quoteVersion).toBe(1);
    });

    it.each<[string, () => ServiceOrder]>([
      ['Recebida', opened],
      ['Aguardando aprovação', awaitingApproval],
      ['Em execução', inExecution],
      ['Finalizada', finished],
    ])('não aceita itens com a OS %s', (_status, build) => {
      const order = build();

      expect(() => order.addService(alignment)).toThrow(
        ServiceOrderActionNotAllowedError,
      );
      expect(() => order.addPart(brakePads)).toThrow(
        ServiceOrderActionNotAllowedError,
      );
    });

    it('informa se aceita itens, antes de qualquer efeito colateral', () => {
      expect(() => inDiagnosis().assertAcceptsItems()).not.toThrow();
      expect(() => awaitingApproval().assertAcceptsItems()).toThrow(
        ServiceOrderActionNotAllowedError,
      );
    });

    it('explica a ação recusada com o status', () => {
      expect(() => opened().addService(alignment)).toThrow(
        'Não é possível incluir serviços: a OS está "Recebida"',
      );
    });
  });

  describe('orçamento', () => {
    it('concluir o diagnóstico gera o orçamento e aguarda aprovação', () => {
      const order = awaitingApproval();

      expect(order.status).toBe('AWAITING_APPROVAL');
      expect(order.currentQuote?.version).toBe(1);
      expect(order.currentQuote?.total.toDecimal()).toBe(389.7);
      expect(order.currentQuote?.isPending).toBe(true);
    });

    it('registra o evento QuoteGenerated com o total', () => {
      const order = awaitingApproval();

      const event = order
        .pullDomainEvents()
        .find((e): e is QuoteGenerated => e instanceof QuoteGenerated);

      expect(event?.version).toBe(1);
      expect(event?.total.toDecimal()).toBe(389.7);
    });

    it('não conclui o diagnóstico sem itens', () => {
      expect(() => inDiagnosis().concludeDiagnosis(at('10:00'))).toThrow(
        ServiceOrderWithoutItemsError,
      );
    });

    it('não conclui o diagnóstico fora de Em diagnóstico', () => {
      expect(() => opened().concludeDiagnosis(at('10:00'))).toThrow(
        ServiceOrderActionNotAllowedError,
      );
    });
  });

  describe('aprovação', () => {
    it('aprovar leva a OS para Em execução', () => {
      const order = awaitingApproval();
      order.pullDomainEvents();

      order.approve(1, at('11:00'));

      expect(order.status).toBe('IN_EXECUTION');
      expect(order.currentQuote?.decision).toBe('APPROVED');
      expect(order.approvedTotal.toDecimal()).toBe(389.7);
      expect(order.pullDomainEvents()[0]).toBeInstanceOf(QuoteApproved);
    });

    it.each<[string, () => ServiceOrder]>([
      ['Em diagnóstico', inDiagnosis],
      ['Em execução', inExecution],
    ])('não aprova com a OS %s', (_status, build) => {
      expect(() => build().approve(1, at('12:00'))).toThrow(
        ServiceOrderActionNotAllowedError,
      );
    });

    it('recusa aprovar uma versão que não é a do orçamento pendente', () => {
      const order = awaitingApproval();

      expect(() => order.approve(2, at('11:00'))).toThrow(
        'O orçamento pendente é a versão 1, consulte-a antes de decidir',
      );
      expect(order.status).toBe('AWAITING_APPROVAL');
    });
  });

  describe('rejeição', () => {
    it('rejeitar finaliza a OS sem execução e pede o estorno das peças', () => {
      const order = awaitingApproval();
      order.pullDomainEvents();

      order.reject(1, at('11:00'), 'Valor acima do esperado');

      expect(order.status).toBe('FINISHED');
      expect(order.currentQuote?.rejectionReason).toBe(
        'Valor acima do esperado',
      );
      expect(order.approvedTotal.cents).toBe(0);
      expect(order.getExecutionTime()).toBeNull();

      const [event] = order.pullDomainEvents();
      expect(event).toBeInstanceOf(QuoteRejected);
      expect((event as QuoteRejected).partsToReverse).toEqual([
        { partId: 'part-pads', quantity: Quantity.of(2) },
      ]);
    });

    it('não rejeita uma OS em execução, mesmo sendo Em execução → Finalizada uma transição válida', () => {
      expect(() => inExecution().reject(1, at('12:00'))).toThrow(
        ServiceOrderActionNotAllowedError,
      );
    });
  });

  describe('reparo adicional', () => {
    function withAdditionalRepair(): ServiceOrder {
      const order = inExecution();
      order.registerAdditionalRepair(
        { services: [brakeReview], parts: [brakeFluid] },
        at('12:00'),
      );
      return order;
    }

    it('inclui os itens novos na versão 2 e volta para Aguardando aprovação', () => {
      const order = withAdditionalRepair();

      expect(order.status).toBe('AWAITING_APPROVAL');
      expect(order.quotes).toHaveLength(2);
      expect(order.serviceItems.map((i) => i.quoteVersion)).toEqual([1, 2]);
      expect(order.partItems.map((i) => i.quoteVersion)).toEqual([1, 2]);
    });

    it('o novo orçamento cobra só os itens do reparo adicional', () => {
      expect(withAdditionalRepair().currentQuote?.total.toDecimal()).toBe(212);
    });

    it('aprovar o reparo adicional retoma a execução e soma ao total', () => {
      const order = withAdditionalRepair();

      order.approve(2, at('13:00'));

      expect(order.status).toBe('IN_EXECUTION');
      expect(order.approvedTotal.toDecimal()).toBe(601.7);
    });

    it('uma decisão repetida sobre a versão 1 não decide a versão 2', () => {
      const order = withAdditionalRepair();

      expect(() => order.approve(1, at('13:00'))).toThrow(
        QuoteVersionMismatchError,
      );
      expect(() => order.reject(1, at('13:00'))).toThrow(
        QuoteVersionMismatchError,
      );
      expect(order.status).toBe('AWAITING_APPROVAL');
      expect(order.currentQuote?.isPending).toBe(true);
    });

    it('rejeitar o reparo adicional estorna só as peças dele', () => {
      const order = withAdditionalRepair();
      order.pullDomainEvents();

      order.reject(2, at('13:00'));

      const [event] = order.pullDomainEvents() as QuoteRejected[];
      expect(event?.partsToReverse).toEqual([
        { partId: 'part-fluid', quantity: Quantity.of(1) },
      ]);
      expect(order.approvedTotal.toDecimal()).toBe(389.7);
      expect(order.getExecutionTime()).toBe(1 * HOUR);
    });

    it('exige ao menos um item', () => {
      expect(() =>
        inExecution().registerAdditionalRepair({}, at('12:00')),
      ).toThrow(InvalidServiceOrderError);
    });

    it('informa se aceita reparo adicional, antes de qualquer efeito colateral', () => {
      expect(() => inExecution().assertAcceptsAdditionalRepair()).not.toThrow();
      expect(() => awaitingApproval().assertAcceptsAdditionalRepair()).toThrow(
        'Não é possível registrar reparo adicional: a OS está "Aguardando aprovação"',
      );
    });

    it('só é possível durante a execução', () => {
      expect(() =>
        awaitingApproval().registerAdditionalRepair(
          { services: [brakeReview] },
          at('12:00'),
        ),
      ).toThrow(ServiceOrderActionNotAllowedError);
    });
  });

  describe('finalização e entrega', () => {
    it('finaliza a OS em execução', () => {
      const order = inExecution();
      order.pullDomainEvents();

      order.finish(at('13:00'));

      expect(order.status).toBe('FINISHED');
      expect(order.isOpen).toBe(true);
      expect(order.pullDomainEvents()[0]).toBeInstanceOf(ServiceOrderFinished);
    });

    it('não finaliza uma OS aguardando aprovação', () => {
      expect(() => awaitingApproval().finish(at('11:00'))).toThrow(
        ServiceOrderActionNotAllowedError,
      );
    });

    it('entrega o veículo de uma OS finalizada, que deixa de estar aberta', () => {
      const order = finished();
      order.pullDomainEvents();

      order.deliver(at('15:00'));

      expect(order.status).toBe('DELIVERED');
      expect(order.isOpen).toBe(false);
      expect(order.pullDomainEvents()[0]).toBeInstanceOf(ServiceOrderDelivered);
    });

    it('não entrega uma OS em execução', () => {
      expect(() => inExecution().deliver(at('13:00'))).toThrow(
        ServiceOrderActionNotAllowedError,
      );
    });
  });

  describe('ciclo completo', () => {
    it('percorre todos os status e mede o tempo de execução', () => {
      const order = finished();
      order.deliver(at('15:00'));

      expect(order.history.entries.map((entry) => entry.to)).toEqual([
        'RECEIVED',
        'IN_DIAGNOSIS',
        'AWAITING_APPROVAL',
        'IN_EXECUTION',
        'FINISHED',
        'DELIVERED',
      ]);
      expect(order.getExecutionTime()).toBe(2 * HOUR);
      expect(eventsOf(order)).toEqual([
        'ServiceOrderOpened',
        'QuoteGenerated',
        'QuoteApproved',
        'ServiceOrderFinished',
        'ServiceOrderDelivered',
      ]);
    });
  });

  describe('restore', () => {
    it('reconstitui a OS do banco sem registrar eventos', () => {
      const order = ServiceOrder.restore(
        '55555555-5555-5555-5555-555555555555',
        {
          number: 7,
          customerId: 'customer-1',
          vehicleId: 'vehicle-1',
          history: StatusHistory.start(at('08:00')),
          serviceItems: [],
          partItems: [],
          quotes: [],
        },
      );

      expect(order.id).toBe('55555555-5555-5555-5555-555555555555');
      expect(order.number).toBe(7);
      expect(order.status).toBe('RECEIVED');
      expect(order.pullDomainEvents()).toHaveLength(0);
    });
  });
});
