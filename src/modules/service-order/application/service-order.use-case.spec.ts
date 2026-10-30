import { Logger } from '@nestjs/common';
import { Money } from '../../../shared/domain/money.js';
import {
  InvalidQuantityError,
  Quantity,
} from '../../../shared/domain/quantity.js';
import { PartOutOfStockError } from '../../catalog/domain/part.errors.js';
import { ServiceNotFoundError } from '../../catalog/domain/service.errors.js';
import {
  InvalidServiceOrderError,
  QuoteVersionMismatchError,
  ServiceOrderActionNotAllowedError,
  ServiceOrderNotFoundError,
  ServiceOrderWithoutItemsError,
  VehicleHasOpenServiceOrderError,
  VehicleOwnedByAnotherCustomerError,
} from '../domain/service-order.errors.js';
import {
  FakeCustomerDirectory,
  FakeNotificationGateway,
  FakePartStock,
  FakeServiceCatalog,
  ImmediateUnitOfWork,
  InMemoryServiceOrderRepository,
} from '../testing/fakes.js';
import { AddPartToOrderUseCase } from './add-part-to-order.use-case.js';
import { AddServiceToOrderUseCase } from './add-service-to-order.use-case.js';
import { ApproveQuoteUseCase } from './approve-quote.use-case.js';
import { ConcludeDiagnosisUseCase } from './conclude-diagnosis.use-case.js';
import { DeliverServiceOrderUseCase } from './deliver-service-order.use-case.js';
import { FinishServiceOrderUseCase } from './finish-service-order.use-case.js';
import { GetServiceOrderUseCase } from './get-service-order.use-case.js';
import {
  ListServiceOrdersUseCase,
  toOpenedPeriod,
} from './list-service-orders.use-case.js';
import {
  type OpenServiceOrderInput,
  OpenServiceOrderUseCase,
} from './open-service-order.use-case.js';
import { RegisterAdditionalRepairUseCase } from './register-additional-repair.use-case.js';
import { RejectQuoteUseCase } from './reject-quote.use-case.js';
import { ServiceOrderNotifier } from './service-order-notifier.js';
import { StartDiagnosisUseCase } from './start-diagnosis.use-case.js';

const newCustomerAndVehicle: OpenServiceOrderInput = {
  customer: { document: '529.982.247-25', name: 'Maria da Silva' },
  vehicle: { plate: 'BRA2E19', brand: 'Volkswagen', model: 'Gol', year: 2020 },
};

const brakesAndFluid = (serviceOrderId: string) => ({
  serviceOrderId,
  services: ['service-brakes'],
  parts: [{ partId: 'part-fluid', quantity: 1 }],
});

function setup() {
  const orders = new InMemoryServiceOrderRepository();
  const directory = new FakeCustomerDirectory();
  const catalog = new FakeServiceCatalog();
  const stock = new FakePartStock();
  const unitOfWork = new ImmediateUnitOfWork();

  catalog.services.set('service-alignment', {
    id: 'service-alignment',
    name: 'Alinhamento',
    price: Money.fromDecimal(89.9),
  });
  catalog.services.set('service-brakes', {
    id: 'service-brakes',
    name: 'Revisão de freios',
    price: Money.fromDecimal(180),
  });
  stock.parts.set('part-pads', {
    name: 'Pastilha de freio dianteira',
    unitPrice: Money.fromDecimal(149.9),
    quantity: Quantity.of(3),
  });
  stock.parts.set('part-fluid', {
    name: 'Fluido de freio DOT 4',
    unitPrice: Money.fromDecimal(32),
    quantity: Quantity.of(3),
  });

  const notifications = new FakeNotificationGateway();
  const open = new OpenServiceOrderUseCase(orders, directory, unitOfWork);
  const startDiagnosis = new StartDiagnosisUseCase(orders, unitOfWork);
  const addService = new AddServiceToOrderUseCase(orders, catalog, unitOfWork);
  const addPart = new AddPartToOrderUseCase(orders, stock, unitOfWork);
  const notifier = new ServiceOrderNotifier(notifications);
  const concludeDiagnosis = new ConcludeDiagnosisUseCase(
    orders,
    notifier,
    unitOfWork,
  );
  const approve = new ApproveQuoteUseCase(orders, unitOfWork);

  const inDiagnosis = async () => {
    const order = await open.execute(newCustomerAndVehicle);
    await startDiagnosis.execute(order.id);
    return order.id;
  };
  const awaitingApproval = async () => {
    const id = await inDiagnosis();
    await addService.execute({
      serviceOrderId: id,
      serviceId: 'service-alignment',
    });
    await addPart.execute({
      serviceOrderId: id,
      partId: 'part-pads',
      quantity: 2,
    });
    await concludeDiagnosis.execute(id);
    return id;
  };

  return {
    orders,
    directory,
    catalog,
    stock,
    notifications,
    open,
    get: new GetServiceOrderUseCase(orders),
    startDiagnosis,
    addService,
    addPart,
    concludeDiagnosis,
    approve,
    reject: new RejectQuoteUseCase(orders, stock, unitOfWork),
    registerAdditionalRepair: new RegisterAdditionalRepairUseCase(
      orders,
      catalog,
      stock,
      notifier,
      unitOfWork,
    ),
    finish: new FinishServiceOrderUseCase(orders, notifier, unitOfWork),
    deliver: new DeliverServiceOrderUseCase(orders, unitOfWork),
    list: new ListServiceOrdersUseCase(orders),
    inDiagnosis,
    awaitingApproval,
    inExecution: async () => {
      const id = await awaitingApproval();
      await approve.execute({ serviceOrderId: id, version: 1 });
      return id;
    },
  };
}

describe('Casos de uso da OS', () => {
  describe('OpenServiceOrderUseCase', () => {
    it('cadastra cliente e veículo novos e abre a OS como Recebida', async () => {
      const { open, directory } = setup();

      const order = await open.execute(newCustomerAndVehicle);

      expect(order).toMatchObject({
        number: 1,
        status: 'RECEIVED',
        statusLabel: 'Recebida',
        quote: null,
      });
      expect(directory.customers.size).toBe(1);
      expect(directory.vehicles.size).toBe(1);
    });

    it('reaproveita cliente e veículo já cadastrados, só com documento e placa', async () => {
      const { open, directory, orders } = setup();
      const first = await open.execute(newCustomerAndVehicle);
      orders.orders.clear();

      const second = await open.execute({
        customer: { document: '52998224725' },
        vehicle: { plate: 'bra-2e19' },
      });

      expect(second.customerId).toBe(first.customerId);
      expect(second.vehicleId).toBe(first.vehicleId);
      expect(directory.customers.size).toBe(1);
      expect(directory.vehicles.size).toBe(1);
    });

    it('exige o nome para cadastrar um cliente novo', async () => {
      const { open } = setup();

      await expect(
        open.execute({
          ...newCustomerAndVehicle,
          customer: { document: '529.982.247-25' },
        }),
      ).rejects.toThrow(InvalidServiceOrderError);
    });

    it('exige marca, modelo e ano para cadastrar um veículo novo', async () => {
      const { open } = setup();

      await expect(
        open.execute({
          ...newCustomerAndVehicle,
          vehicle: { plate: 'BRA2E19', brand: 'Volkswagen' },
        }),
      ).rejects.toThrow(InvalidServiceOrderError);
    });

    it('recusa a placa de um veículo de outro cliente', async () => {
      const { open } = setup();
      await open.execute(newCustomerAndVehicle);

      await expect(
        open.execute({
          ...newCustomerAndVehicle,
          customer: {
            document: '11.222.333/0001-81',
            name: 'Oficina Parceira',
          },
        }),
      ).rejects.toThrow(VehicleOwnedByAnotherCustomerError);
    });

    it('recusa uma segunda OS aberta para o mesmo veículo', async () => {
      const { open, orders } = setup();
      await open.execute(newCustomerAndVehicle);

      await expect(open.execute(newCustomerAndVehicle)).rejects.toThrow(
        VehicleHasOpenServiceOrderError,
      );
      expect(orders.orders.size).toBe(1);
    });
  });

  describe('StartDiagnosisUseCase e GetServiceOrderUseCase', () => {
    it('inicia o diagnóstico e persiste o histórico', async () => {
      const { inDiagnosis, get } = setup();

      const id = await inDiagnosis();

      const order = await get.execute(id);
      expect(order.status).toBe('IN_DIAGNOSIS');
      expect(order.history.map((change) => change.to)).toEqual([
        'RECEIVED',
        'IN_DIAGNOSIS',
      ]);
    });

    it('responde não encontrado para OS inexistente', async () => {
      const { startDiagnosis, get } = setup();

      await expect(startDiagnosis.execute('inexistente')).rejects.toThrow(
        ServiceOrderNotFoundError,
      );
      await expect(get.execute('inexistente')).rejects.toThrow(
        ServiceOrderNotFoundError,
      );
    });
  });

  describe('AddServiceToOrderUseCase', () => {
    it('inclui o serviço com o preço do catálogo congelado', async () => {
      const { inDiagnosis, addService, catalog, get } = setup();
      const id = await inDiagnosis();

      await addService.execute({
        serviceOrderId: id,
        serviceId: 'service-alignment',
      });
      catalog.services.set('service-alignment', {
        id: 'service-alignment',
        name: 'Alinhamento',
        price: Money.fromDecimal(120),
      });

      const order = await get.execute(id);
      expect(order.services).toEqual([
        {
          serviceId: 'service-alignment',
          name: 'Alinhamento',
          price: 89.9,
          quoteVersion: 1,
          decision: null,
        },
      ]);
    });

    it('propaga o serviço inexistente no catálogo', async () => {
      const { inDiagnosis, addService } = setup();
      const id = await inDiagnosis();

      await expect(
        addService.execute({ serviceOrderId: id, serviceId: 'inexistente' }),
      ).rejects.toThrow(ServiceNotFoundError);
    });

    it('recusa incluir serviço fora do diagnóstico', async () => {
      const { open, addService } = setup();
      const { id } = await open.execute(newCustomerAndVehicle);

      await expect(
        addService.execute({
          serviceOrderId: id,
          serviceId: 'service-alignment',
        }),
      ).rejects.toThrow(ServiceOrderActionNotAllowedError);
    });
  });

  describe('AddPartToOrderUseCase', () => {
    it('dá baixa no estoque e inclui a peça com o preço unitário', async () => {
      const { inDiagnosis, addPart, stock, get } = setup();
      const id = await inDiagnosis();

      await addPart.execute({
        serviceOrderId: id,
        partId: 'part-pads',
        quantity: 2,
      });

      const order = await get.execute(id);
      expect(order.parts).toEqual([
        {
          partId: 'part-pads',
          name: 'Pastilha de freio dianteira',
          unitPrice: 149.9,
          quantity: 2,
          total: 299.8,
          quoteVersion: 1,
          decision: null,
        },
      ]);
      expect(stock.parts.get('part-pads')?.quantity.value).toBe(1);
    });

    it('sem saldo, não inclui a peça nem altera o estoque', async () => {
      const { inDiagnosis, addPart, stock, get } = setup();
      const id = await inDiagnosis();

      await expect(
        addPart.execute({
          serviceOrderId: id,
          partId: 'part-pads',
          quantity: 5,
        }),
      ).rejects.toThrow(PartOutOfStockError);

      expect((await get.execute(id)).parts).toHaveLength(0);
      expect(stock.parts.get('part-pads')?.quantity.value).toBe(3);
    });

    it('fora do diagnóstico, recusa antes de mexer no estoque', async () => {
      const { open, addPart, stock } = setup();
      const { id } = await open.execute(newCustomerAndVehicle);

      await expect(
        addPart.execute({
          serviceOrderId: id,
          partId: 'part-pads',
          quantity: 1,
        }),
      ).rejects.toThrow(ServiceOrderActionNotAllowedError);
      expect(stock.parts.get('part-pads')?.quantity.value).toBe(3);
    });

    it('recusa quantidade fracionada', async () => {
      const { inDiagnosis, addPart } = setup();
      const id = await inDiagnosis();

      await expect(
        addPart.execute({
          serviceOrderId: id,
          partId: 'part-pads',
          quantity: 1.5,
        }),
      ).rejects.toThrow(InvalidQuantityError);
    });
  });

  describe('ConcludeDiagnosisUseCase', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('gera o orçamento, aguarda aprovação e avisa o cliente', async () => {
      const { awaitingApproval, get, notifications } = setup();

      const id = await awaitingApproval();

      const order = await get.execute(id);
      expect(order.status).toBe('AWAITING_APPROVAL');
      expect(order.quote).toMatchObject({
        version: 1,
        total: 389.7,
        decision: null,
      });
      expect(notifications.quotesAvailable).toHaveLength(1);
      expect(notifications.quotesAvailable[0]).toMatchObject({
        customerId: order.customerId,
        serviceOrderId: id,
      });
    });

    it('sem itens, não conclui e não avisa o cliente', async () => {
      const { inDiagnosis, concludeDiagnosis, get, notifications } = setup();
      const id = await inDiagnosis();

      await expect(concludeDiagnosis.execute(id)).rejects.toThrow(
        ServiceOrderWithoutItemsError,
      );
      expect((await get.execute(id)).status).toBe('IN_DIAGNOSIS');
      expect(notifications.quotesAvailable).toHaveLength(0);
    });

    it('uma falha na notificação não desfaz a conclusão', async () => {
      const { awaitingApproval, get, notifications } = setup();
      vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
      vi.spyOn(notifications, 'quoteAvailable').mockRejectedValue(
        new Error('canal fora do ar'),
      );

      const id = await awaitingApproval();

      expect((await get.execute(id)).status).toBe('AWAITING_APPROVAL');
    });

    it('responde não encontrado para OS inexistente', async () => {
      const { concludeDiagnosis } = setup();

      await expect(concludeDiagnosis.execute('inexistente')).rejects.toThrow(
        ServiceOrderNotFoundError,
      );
    });
  });

  describe('ApproveQuoteUseCase', () => {
    it('aprova a versão pendente e leva a OS para Em execução', async () => {
      const { awaitingApproval, approve, stock } = setup();
      const id = await awaitingApproval();

      const order = await approve.execute({ serviceOrderId: id, version: 1 });

      expect(order.status).toBe('IN_EXECUTION');
      expect(order.quote?.decision).toBe('APPROVED');
      expect(order.quote?.decidedAt).toBeInstanceOf(Date);
      expect(stock.parts.get('part-pads')?.quantity.value).toBe(1);
    });

    it('recusa a decisão sobre outra versão sem alterar a OS', async () => {
      const { awaitingApproval, approve, get } = setup();
      const id = await awaitingApproval();

      await expect(
        approve.execute({ serviceOrderId: id, version: 2 }),
      ).rejects.toThrow(QuoteVersionMismatchError);
      expect((await get.execute(id)).status).toBe('AWAITING_APPROVAL');
    });

    it('responde não encontrado para OS inexistente', async () => {
      const { approve } = setup();

      await expect(
        approve.execute({ serviceOrderId: 'inexistente', version: 1 }),
      ).rejects.toThrow(ServiceOrderNotFoundError);
    });
  });

  describe('RejectQuoteUseCase', () => {
    it('finaliza sem execução, registra o motivo e estorna as peças', async () => {
      const { awaitingApproval, reject, stock } = setup();
      const id = await awaitingApproval();

      const order = await reject.execute({
        serviceOrderId: id,
        version: 1,
        reason: 'Valor acima do esperado',
      });

      expect(order.status).toBe('FINISHED');
      expect(order.quote).toMatchObject({
        decision: 'REJECTED',
        rejectionReason: 'Valor acima do esperado',
      });
      expect(order.history.map((change) => change.to)).not.toContain(
        'IN_EXECUTION',
      );
      expect(stock.parts.get('part-pads')?.quantity.value).toBe(3);
    });

    it('uma decisão recusada não estorna nada', async () => {
      const { awaitingApproval, reject, stock } = setup();
      const id = await awaitingApproval();

      await expect(
        reject.execute({ serviceOrderId: id, version: 2 }),
      ).rejects.toThrow(QuoteVersionMismatchError);
      expect(stock.parts.get('part-pads')?.quantity.value).toBe(1);
    });

    it('rejeita mesmo que a peça tenha sido removida do catálogo', async () => {
      const { awaitingApproval, reject, stock } = setup();
      const id = await awaitingApproval();
      stock.parts.delete('part-pads');

      const order = await reject.execute({ serviceOrderId: id, version: 1 });

      expect(order.status).toBe('FINISHED');
    });

    it('não rejeita um orçamento já aprovado', async () => {
      const { awaitingApproval, approve, reject } = setup();
      const id = await awaitingApproval();
      await approve.execute({ serviceOrderId: id, version: 1 });

      await expect(
        reject.execute({ serviceOrderId: id, version: 1 }),
      ).rejects.toThrow(ServiceOrderActionNotAllowedError);
    });
  });

  describe('RegisterAdditionalRepairUseCase', () => {
    it('inclui os itens na versão 2, dá baixa e volta para Aguardando aprovação', async () => {
      const { inExecution, registerAdditionalRepair, stock } = setup();
      const id = await inExecution();

      const order = await registerAdditionalRepair.execute(brakesAndFluid(id));

      expect(order.status).toBe('AWAITING_APPROVAL');
      expect(order.quote).toMatchObject({
        version: 2,
        total: 212,
        decision: null,
      });
      expect(order.services).toHaveLength(2);
      expect(order.parts).toHaveLength(2);
      expect(stock.parts.get('part-fluid')?.quantity.value).toBe(2);
    });

    it('avisa o cliente sobre o novo orçamento', async () => {
      const { inExecution, registerAdditionalRepair, notifications } = setup();
      const id = await inExecution();

      await registerAdditionalRepair.execute(brakesAndFluid(id));

      expect(notifications.quotesAvailable).toHaveLength(2);
      expect(notifications.quotesAvailable[1]?.total.cents).toBe(21200);
    });

    it('sem saldo de uma das peças, não altera a OS', async () => {
      const { inExecution, registerAdditionalRepair, get } = setup();
      const id = await inExecution();

      await expect(
        registerAdditionalRepair.execute({
          serviceOrderId: id,
          parts: [
            { partId: 'part-fluid', quantity: 1 },
            { partId: 'part-pads', quantity: 5 },
          ],
        }),
      ).rejects.toThrow(PartOutOfStockError);
      const order = await get.execute(id);
      expect(order.status).toBe('IN_EXECUTION');
      expect(order.parts).toHaveLength(1);
    });

    it('fora da execução, recusa antes de consultar o catálogo e o estoque', async () => {
      const { awaitingApproval, registerAdditionalRepair, stock } = setup();
      const id = await awaitingApproval();

      await expect(
        registerAdditionalRepair.execute({
          serviceOrderId: id,
          services: ['inexistente'],
          parts: [{ partId: 'part-fluid', quantity: 1 }],
        }),
      ).rejects.toThrow(ServiceOrderActionNotAllowedError);
      expect(stock.parts.get('part-fluid')?.quantity.value).toBe(3);
    });

    it('exige ao menos um item', async () => {
      const { inExecution, registerAdditionalRepair } = setup();
      const id = await inExecution();

      await expect(
        registerAdditionalRepair.execute({ serviceOrderId: id }),
      ).rejects.toThrow(InvalidServiceOrderError);
    });

    it('a aprovação da versão 2 retoma a execução', async () => {
      const { inExecution, registerAdditionalRepair, approve } = setup();
      const id = await inExecution();
      await registerAdditionalRepair.execute(brakesAndFluid(id));

      const order = await approve.execute({ serviceOrderId: id, version: 2 });

      expect(order.status).toBe('IN_EXECUTION');
      expect(order.approvedTotal).toBe(601.7);
    });

    it('informa o total aprovado, o total se aprovado e a versão de cada item', async () => {
      const { inExecution, registerAdditionalRepair } = setup();
      const id = await inExecution();

      const order = await registerAdditionalRepair.execute(brakesAndFluid(id));

      expect(order.approvedTotal).toBe(389.7);
      expect(order.totalIfApproved).toBe(601.7);
      expect(
        order.services.map(({ quoteVersion, decision }) => ({
          quoteVersion,
          decision,
        })),
      ).toEqual([
        { quoteVersion: 1, decision: 'APPROVED' },
        { quoteVersion: 2, decision: null },
      ]);
    });

    it('a rejeição da versão 2 estorna só as peças dela e retoma a execução', async () => {
      const { inExecution, registerAdditionalRepair, reject, stock } = setup();
      const id = await inExecution();
      await registerAdditionalRepair.execute(brakesAndFluid(id));

      const order = await reject.execute({ serviceOrderId: id, version: 2 });

      expect(order.status).toBe('IN_EXECUTION');
      expect(order.approvedTotal).toBe(389.7);
      expect(order.parts.map((part) => part.decision)).toEqual([
        'APPROVED',
        'REJECTED',
      ]);
      expect(stock.parts.get('part-fluid')?.quantity.value).toBe(3);
      expect(stock.parts.get('part-pads')?.quantity.value).toBe(1);
    });
  });

  describe('FinishServiceOrderUseCase', () => {
    it('finaliza a OS depois da rejeição de um reparo adicional', async () => {
      const { inExecution, registerAdditionalRepair, reject, finish } = setup();
      const id = await inExecution();
      await registerAdditionalRepair.execute(brakesAndFluid(id));
      await reject.execute({ serviceOrderId: id, version: 2 });

      const order = await finish.execute(id);

      expect(order.status).toBe('FINISHED');
    });

    it('finaliza a OS em execução e avisa o cliente', async () => {
      const { inExecution, finish, notifications } = setup();
      const id = await inExecution();

      const order = await finish.execute(id);

      expect(order.status).toBe('FINISHED');
      expect(notifications.ordersFinished).toEqual([
        { customerId: order.customerId, serviceOrderId: id },
      ]);
    });

    it('não finaliza uma OS aguardando aprovação nem avisa o cliente', async () => {
      const { awaitingApproval, finish, notifications } = setup();
      const id = await awaitingApproval();

      await expect(finish.execute(id)).rejects.toThrow(
        ServiceOrderActionNotAllowedError,
      );
      expect(notifications.ordersFinished).toHaveLength(0);
    });

    it('responde não encontrado para OS inexistente', async () => {
      const { finish } = setup();

      await expect(finish.execute('inexistente')).rejects.toThrow(
        ServiceOrderNotFoundError,
      );
    });
  });

  describe('DeliverServiceOrderUseCase', () => {
    it('entrega o veículo e o libera para uma nova OS', async () => {
      const { inExecution, finish, deliver, open } = setup();
      const id = await inExecution();
      await finish.execute(id);

      const order = await deliver.execute(id);

      expect(order.status).toBe('DELIVERED');
      const next = await open.execute(newCustomerAndVehicle);
      expect(next.vehicleId).toBe(order.vehicleId);
      expect(next.number).toBe(2);
    });

    it('entrega o veículo de uma OS com o orçamento rejeitado', async () => {
      const { awaitingApproval, reject, deliver } = setup();
      const id = await awaitingApproval();
      await reject.execute({ serviceOrderId: id, version: 1 });

      const order = await deliver.execute(id);

      expect(order.status).toBe('DELIVERED');
    });

    it('não entrega o veículo de uma OS em execução', async () => {
      const { inExecution, deliver } = setup();
      const id = await inExecution();

      await expect(deliver.execute(id)).rejects.toThrow(
        ServiceOrderActionNotAllowedError,
      );
    });
  });

  describe('ListServiceOrdersUseCase', () => {
    const secondVehicle: OpenServiceOrderInput = {
      customer: { document: '529.982.247-25' },
      vehicle: { plate: 'ABC1234', brand: 'Fiat', model: 'Uno', year: 2015 },
    };

    it('lista em resumo, da OS mais recente para a mais antiga', async () => {
      const { open, list } = setup();
      await open.execute(newCustomerAndVehicle);
      const second = await open.execute(secondVehicle);

      const result = await list.execute({
        customerId: second.customerId,
        page: 1,
        pageSize: 10,
      });

      expect(result.total).toBe(2);
      expect(result.items.map((order) => order.number)).toEqual([2, 1]);
      expect(result.items[0]).toEqual({
        id: second.id,
        number: 2,
        customerId: second.customerId,
        vehicleId: second.vehicleId,
        status: 'RECEIVED',
        statusLabel: 'Recebida',
        openedAt: expect.any(Date),
      });
    });

    it('filtra pelo status', async () => {
      const { inDiagnosis, open, list } = setup();
      const id = await inDiagnosis();
      await open.execute(secondVehicle);

      const result = await list.execute({
        status: 'IN_DIAGNOSIS',
        page: 1,
        pageSize: 10,
      });

      expect(result.items.map((order) => order.id)).toEqual([id]);
    });

    it('pagina e informa o total', async () => {
      const { open, list } = setup();
      await open.execute(newCustomerAndVehicle);
      await open.execute(secondVehicle);

      const result = await list.execute({ page: 2, pageSize: 1 });

      expect(result).toMatchObject({ total: 2, page: 2, pageSize: 1 });
      expect(result.items.map((order) => order.number)).toEqual([1]);
    });

    describe('período de abertura, no horário de Brasília', () => {
      afterEach(() => {
        vi.useRealTimers();
      });

      async function openedAt(iso: string) {
        const { open, list } = setup();
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date(iso));
        await open.execute(newCustomerAndVehicle);
        vi.useRealTimers();
        const count = async (openedFrom?: string, openedTo?: string) =>
          (await list.execute({ openedFrom, openedTo, page: 1, pageSize: 10 }))
            .total;
        return count;
      }

      it('converte as datas no intervalo do dia inteiro em -03:00', () => {
        expect(toOpenedPeriod('2026-10-01', '2026-10-31')).toEqual({
          openedFrom: new Date('2026-10-01T03:00:00.000Z'),
          openedBefore: new Date('2026-11-01T03:00:00.000Z'),
        });
      });

      it('sem datas, não limita o período', () => {
        expect(toOpenedPeriod()).toEqual({
          openedFrom: undefined,
          openedBefore: undefined,
        });
      });

      it('uma OS das 22h de 31/10 em Brasília é do dia 31, embora já seja 01/11 em UTC', async () => {
        const count = await openedAt('2026-10-31T22:00:00.000-03:00');

        expect(await count(undefined, '2026-10-31')).toBe(1);
        expect(await count('2026-11-01')).toBe(0);
      });

      it('o dia final entra inteiro, até o último milissegundo', async () => {
        const count = await openedAt('2026-10-31T23:59:59.999-03:00');

        expect(await count('2026-10-31', '2026-10-31')).toBe(1);
      });

      it('início depois do fim não lista nada', async () => {
        const count = await openedAt('2026-10-15T12:00:00.000-03:00');

        expect(await count('2026-10-31', '2026-10-01')).toBe(0);
      });
    });
  });
});
