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
import { GetServiceOrderUseCase } from './get-service-order.use-case.js';
import {
  type OpenServiceOrderInput,
  OpenServiceOrderUseCase,
} from './open-service-order.use-case.js';
import { RejectQuoteUseCase } from './reject-quote.use-case.js';
import { ServiceOrderNotifier } from './service-order-notifier.js';
import { StartDiagnosisUseCase } from './start-diagnosis.use-case.js';

const newCustomerAndVehicle: OpenServiceOrderInput = {
  customer: { document: '529.982.247-25', name: 'Maria da Silva' },
  vehicle: { plate: 'BRA2E19', brand: 'Volkswagen', model: 'Gol', year: 2020 },
};

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
  stock.parts.set('part-pads', {
    name: 'Pastilha de freio dianteira',
    unitPrice: Money.fromDecimal(149.9),
    quantity: Quantity.of(3),
  });

  const notifications = new FakeNotificationGateway();
  const open = new OpenServiceOrderUseCase(orders, directory, unitOfWork);
  const startDiagnosis = new StartDiagnosisUseCase(orders, unitOfWork);
  const addService = new AddServiceToOrderUseCase(orders, catalog, unitOfWork);
  const addPart = new AddPartToOrderUseCase(orders, stock, unitOfWork);
  const concludeDiagnosis = new ConcludeDiagnosisUseCase(
    orders,
    new ServiceOrderNotifier(notifications),
    unitOfWork,
  );

  const inDiagnosis = async () => {
    const order = await open.execute(newCustomerAndVehicle);
    await startDiagnosis.execute(order.id);
    return order.id;
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
    approve: new ApproveQuoteUseCase(orders, unitOfWork),
    reject: new RejectQuoteUseCase(orders, stock, unitOfWork),
    inDiagnosis,
    awaitingApproval: async () => {
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
        { serviceId: 'service-alignment', name: 'Alinhamento', price: 89.9 },
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
});
