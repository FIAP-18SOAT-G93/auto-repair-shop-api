import { Customer } from '../domain/customer.js';
import { CustomerNotFoundError } from '../domain/customer.errors.js';
import { Document } from '../domain/document.js';
import { InvalidLicensePlateError } from '../domain/license-plate.js';
import {
  InvalidVehicleError,
  LicensePlateAlreadyRegisteredError,
  VehicleHasOpenServiceOrdersError,
  VehicleNotFoundError,
} from '../domain/vehicle.errors.js';
import {
  FakeServiceOrderChecker,
  InMemoryCustomerRepository,
  InMemoryVehicleRepository,
} from '../testing/fakes.js';
import { CreateVehicleUseCase } from './create-vehicle.use-case.js';
import { DeleteVehicleUseCase } from './delete-vehicle.use-case.js';
import { FindVehicleByPlateUseCase } from './find-vehicle-by-plate.use-case.js';
import { GetVehicleUseCase } from './get-vehicle.use-case.js';
import { ListVehiclesUseCase } from './list-vehicles.use-case.js';
import { UpdateVehicleUseCase } from './update-vehicle.use-case.js';

async function setup() {
  const customers = new InMemoryCustomerRepository();
  const vehicles = new InMemoryVehicleRepository();
  const checker = new FakeServiceOrderChecker();
  const owner = Customer.create({
    name: 'Maria da Silva',
    document: Document.create('529.982.247-25'),
  });
  await customers.save(owner);

  return {
    owner,
    vehicles,
    checker,
    input: {
      customerId: owner.id,
      plate: 'bra-2e19',
      brand: 'Volkswagen',
      model: 'Gol',
      year: 2020,
    },
    create: new CreateVehicleUseCase(vehicles, customers),
    get: new GetVehicleUseCase(vehicles),
    findByPlate: new FindVehicleByPlateUseCase(vehicles),
    list: new ListVehiclesUseCase(vehicles),
    update: new UpdateVehicleUseCase(vehicles),
    remove: new DeleteVehicleUseCase(vehicles, checker),
  };
}

describe('Casos de uso de veículos', () => {
  describe('CreateVehicleUseCase', () => {
    it('cadastra o veículo do cliente e devolve a placa formatada', async () => {
      const { create, input, owner } = await setup();

      const output = await create.execute(input);

      expect(output).toMatchObject({
        customerId: owner.id,
        plate: 'BRA2E19',
        plateType: 'MERCOSUL',
        year: 2020,
      });
    });

    it('rejeita placa em formato inválido', async () => {
      const { create, input } = await setup();

      await expect(
        create.execute({ ...input, plate: 'ABCD123' }),
      ).rejects.toThrow(InvalidLicensePlateError);
    });

    it('rejeita cliente inexistente', async () => {
      const { create, input } = await setup();

      await expect(
        create.execute({ ...input, customerId: 'cliente-inexistente' }),
      ).rejects.toThrow(CustomerNotFoundError);
    });

    it('rejeita cliente removido', async () => {
      const { create, input, owner } = await setup();
      owner.delete(new Date());

      await expect(create.execute(input)).rejects.toThrow(
        CustomerNotFoundError,
      );
    });

    it('rejeita placa já cadastrada, em qualquer formatação', async () => {
      const { create, input } = await setup();
      await create.execute(input);

      await expect(
        create.execute({ ...input, plate: 'BRA2E19' }),
      ).rejects.toThrow(LicensePlateAlreadyRegisteredError);
    });

    it('rejeita ano inválido', async () => {
      const { create, input } = await setup();

      await expect(create.execute({ ...input, year: 1800 })).rejects.toThrow(
        InvalidVehicleError,
      );
    });
  });

  describe('consultas', () => {
    it('busca por id e por placa', async () => {
      const { create, get, findByPlate, input } = await setup();
      const { id } = await create.execute(input);

      expect((await get.execute(id)).brand).toBe('Volkswagen');
      expect((await findByPlate.execute('BRA 2E19')).id).toBe(id);
    });

    it('responde não encontrado para id e placa sem cadastro', async () => {
      const { get, findByPlate } = await setup();

      await expect(get.execute('id-inexistente')).rejects.toThrow(
        VehicleNotFoundError,
      );
      await expect(findByPlate.execute('ABC1234')).rejects.toThrow(
        VehicleNotFoundError,
      );
    });

    it('lista os veículos de um cliente', async () => {
      const { create, list, input, owner } = await setup();
      await create.execute(input);

      const output = await list.execute({
        customerId: owner.id,
        page: 1,
        pageSize: 10,
      });

      expect(output).toMatchObject({ total: 1, page: 1, pageSize: 10 });
      expect(output.items[0]?.plate).toBe('BRA2E19');
    });
  });

  describe('UpdateVehicleUseCase', () => {
    it('altera marca, modelo e ano', async () => {
      const { create, update, get, input } = await setup();
      const { id } = await create.execute(input);

      await update.execute(id, { brand: 'Fiat', model: 'Uno', year: 2015 });

      expect(await get.execute(id)).toMatchObject({
        brand: 'Fiat',
        model: 'Uno',
        year: 2015,
        plate: 'BRA2E19',
      });
    });

    it('responde não encontrado para id inexistente', async () => {
      const { update } = await setup();

      await expect(
        update.execute('id-inexistente', {
          brand: 'Fiat',
          model: 'Uno',
          year: 2015,
        }),
      ).rejects.toThrow(VehicleNotFoundError);
    });
  });

  describe('DeleteVehicleUseCase', () => {
    it('marca o veículo como removido', async () => {
      const { create, remove, vehicles, input } = await setup();
      const { id } = await create.execute(input);

      await remove.execute(id);

      expect(await vehicles.findById(id)).toBeNull();
      expect(vehicles.vehicles.get(id)?.isDeleted).toBe(true);
    });

    it('bloqueia a remoção de veículo com OS aberta, sem alterar nada', async () => {
      const { create, remove, vehicles, checker, input } = await setup();
      const { id } = await create.execute(input);
      checker.vehiclesWithOpenOrders.add(id);

      await expect(remove.execute(id)).rejects.toThrow(
        VehicleHasOpenServiceOrdersError,
      );
      expect(await vehicles.findById(id)).not.toBeNull();
    });

    it('responde não encontrado para id inexistente', async () => {
      const { remove } = await setup();

      await expect(remove.execute('id-inexistente')).rejects.toThrow(
        VehicleNotFoundError,
      );
    });
  });
});
