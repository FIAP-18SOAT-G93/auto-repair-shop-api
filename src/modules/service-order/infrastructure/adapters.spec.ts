import { Logger } from '@nestjs/common';
import { Money } from '../../../shared/domain/money.js';
import { Quantity } from '../../../shared/domain/quantity.js';
import { DeductStockUseCase } from '../../catalog/application/deduct-stock.use-case.js';
import { GetServiceUseCase } from '../../catalog/application/get-service.use-case.js';
import { ReverseStockUseCase } from '../../catalog/application/reverse-stock.use-case.js';
import { PartType } from '../../catalog/domain/part-type.js';
import { Part } from '../../catalog/domain/part.js';
import { PartOutOfStockError } from '../../catalog/domain/part.errors.js';
import { Service } from '../../catalog/domain/service.js';
import { ServiceNotFoundError } from '../../catalog/domain/service.errors.js';
import {
  InMemoryPartRepository,
  InMemoryServiceRepository,
} from '../../catalog/testing/fakes.js';
import { CreateCustomerUseCase } from '../../customer/application/create-customer.use-case.js';
import { CreateVehicleUseCase } from '../../customer/application/create-vehicle.use-case.js';
import { FindCustomerByDocumentUseCase } from '../../customer/application/find-customer-by-document.use-case.js';
import { FindVehicleByPlateUseCase } from '../../customer/application/find-vehicle-by-plate.use-case.js';
import { InvalidDocumentError } from '../../customer/domain/document.js';
import {
  InMemoryCustomerRepository,
  InMemoryVehicleRepository,
} from '../../customer/testing/fakes.js';
import { ServiceOrder } from '../domain/service-order.js';
import { InMemoryServiceOrderRepository } from '../testing/fakes.js';
import { CustomerModuleDirectory } from './customer-directory.adapter.js';
import { CatalogModulePartStock } from './part-stock.adapter.js';
import { CatalogModuleServiceCatalog } from './service-catalog.adapter.js';
import { RepositoryServiceOrderChecker } from './service-order-checker.adapter.js';

describe('Adaptadores do módulo de OS', () => {
  describe('CustomerModuleDirectory', () => {
    function setup() {
      const customers = new InMemoryCustomerRepository();
      const vehicles = new InMemoryVehicleRepository();
      return new CustomerModuleDirectory(
        new FindCustomerByDocumentUseCase(customers),
        new CreateCustomerUseCase(customers),
        new FindVehicleByPlateUseCase(vehicles),
        new CreateVehicleUseCase(vehicles, customers),
      );
    }

    it('responde null para cliente e veículo sem cadastro', async () => {
      const directory = setup();

      expect(await directory.findCustomerByDocument('52998224725')).toBeNull();
      expect(await directory.findVehicleByPlate('BRA2E19')).toBeNull();
    });

    it('cadastra e depois encontra o cliente e o veículo', async () => {
      const directory = setup();

      const customer = await directory.registerCustomer({
        document: '529.982.247-25',
        name: 'Maria da Silva',
      });
      const vehicle = await directory.registerVehicle({
        customerId: customer.id,
        plate: 'BRA2E19',
        brand: 'Volkswagen',
        model: 'Gol',
        year: 2020,
      });

      expect(await directory.findCustomerByDocument('52998224725')).toEqual(
        customer,
      );
      expect(await directory.findVehicleByPlate('bra-2e19')).toEqual({
        id: vehicle.id,
        customerId: customer.id,
      });
    });

    it('não esconde outros erros, como documento inválido', async () => {
      await expect(setup().findCustomerByDocument('123')).rejects.toThrow(
        InvalidDocumentError,
      );
    });
  });

  describe('CatalogModuleServiceCatalog', () => {
    it('devolve o serviço com o preço como Money', async () => {
      const services = new InMemoryServiceRepository();
      const service = Service.create({
        name: 'Alinhamento',
        price: Money.fromDecimal(89.9),
        estimatedMinutes: 40,
      });
      await services.save(service);
      const catalog = new CatalogModuleServiceCatalog(
        new GetServiceUseCase(services),
      );

      const found = await catalog.getService(service.id);

      expect(found).toMatchObject({ id: service.id, name: 'Alinhamento' });
      expect(found.price.cents).toBe(8990);
    });

    it('propaga o serviço inexistente', async () => {
      const catalog = new CatalogModuleServiceCatalog(
        new GetServiceUseCase(new InMemoryServiceRepository()),
      );

      await expect(catalog.getService('inexistente')).rejects.toThrow(
        ServiceNotFoundError,
      );
    });
  });

  describe('CatalogModulePartStock', () => {
    async function setup(quantity: number) {
      const parts = new InMemoryPartRepository();
      const part = Part.create({
        name: 'Pastilha de freio dianteira',
        type: PartType.PART,
        price: Money.fromDecimal(149.9),
        quantity: Quantity.of(quantity),
      });
      await parts.save(part);
      const stock = new CatalogModulePartStock(
        new DeductStockUseCase(parts),
        new ReverseStockUseCase(parts),
      );
      return { parts, part, stock };
    }

    it('dá baixa e devolve o preço unitário como Money', async () => {
      const { parts, part, stock } = await setup(5);

      const deducted = await stock.deduct(part.id, Quantity.of(2));

      expect(deducted.unitPrice.cents).toBe(14990);
      expect((await parts.findById(part.id))?.quantity.value).toBe(3);
    });

    it('estorna a quantidade', async () => {
      const { parts, part, stock } = await setup(5);
      await stock.deduct(part.id, Quantity.of(2));

      await stock.reverse(part.id, Quantity.of(2));

      expect((await parts.findById(part.id))?.quantity.value).toBe(5);
    });

    it('ignora o estorno de uma peça removida do catálogo', async () => {
      const { parts, part, stock } = await setup(5);
      await parts.delete(part.id);
      const warnSpy = vi
        .spyOn(Logger.prototype, 'warn')
        .mockImplementation(() => {});

      await expect(
        stock.reverse(part.id, Quantity.of(2)),
      ).resolves.toBeUndefined();
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining(part.id));
      warnSpy.mockRestore();
    });

    it('propaga a falta de saldo', async () => {
      const { part, stock } = await setup(1);

      await expect(stock.deduct(part.id, Quantity.of(2))).rejects.toThrow(
        PartOutOfStockError,
      );
    });
  });

  describe('RepositoryServiceOrderChecker', () => {
    it('responde se o cliente e o veículo têm OS aberta', async () => {
      const orders = new InMemoryServiceOrderRepository();
      const checker = new RepositoryServiceOrderChecker(orders);
      await orders.save(
        ServiceOrder.open(
          { number: 1, customerId: 'customer-1', vehicleId: 'vehicle-1' },
          new Date(),
        ),
      );

      expect(await checker.customerHasOpenServiceOrders('customer-1')).toBe(
        true,
      );
      expect(await checker.vehicleHasOpenServiceOrders('vehicle-1')).toBe(true);
      expect(await checker.customerHasOpenServiceOrders('customer-2')).toBe(
        false,
      );
      expect(await checker.vehicleHasOpenServiceOrders('vehicle-2')).toBe(
        false,
      );
    });
  });
});
