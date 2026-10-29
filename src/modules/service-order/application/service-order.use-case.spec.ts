import { Money } from '../../../shared/domain/money.js';
import {
  InvalidQuantityError,
  Quantity,
} from '../../../shared/domain/quantity.js';
import { PartOutOfStockError } from '../../catalog/domain/part.errors.js';
import { ServiceNotFoundError } from '../../catalog/domain/service.errors.js';
import {
  InvalidServiceOrderError,
  ServiceOrderActionNotAllowedError,
  ServiceOrderNotFoundError,
  VehicleHasOpenServiceOrderError,
  VehicleOwnedByAnotherCustomerError,
} from '../domain/service-order.errors.js';
import {
  FakeCustomerDirectory,
  FakePartStock,
  FakeServiceCatalog,
  ImmediateUnitOfWork,
  InMemoryServiceOrderRepository,
} from '../testing/fakes.js';
import { AddPartToOrderUseCase } from './add-part-to-order.use-case.js';
import { AddServiceToOrderUseCase } from './add-service-to-order.use-case.js';
import { GetServiceOrderUseCase } from './get-service-order.use-case.js';
import {
  type OpenServiceOrderInput,
  OpenServiceOrderUseCase,
} from './open-service-order.use-case.js';
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

  const open = new OpenServiceOrderUseCase(orders, directory, unitOfWork);
  const startDiagnosis = new StartDiagnosisUseCase(orders, unitOfWork);

  return {
    orders,
    directory,
    catalog,
    stock,
    open,
    get: new GetServiceOrderUseCase(orders),
    startDiagnosis,
    addService: new AddServiceToOrderUseCase(orders, catalog, unitOfWork),
    addPart: new AddPartToOrderUseCase(orders, stock, unitOfWork),
    inDiagnosis: async () => {
      const order = await open.execute(newCustomerAndVehicle);
      await startDiagnosis.execute(order.id);
      return order.id;
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
});
