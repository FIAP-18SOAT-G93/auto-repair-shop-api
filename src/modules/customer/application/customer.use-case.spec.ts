import {
  CustomerHasOpenServiceOrdersError,
  CustomerHasVehiclesError,
  CustomerNotFoundError,
  DocumentAlreadyRegisteredError,
} from '../domain/customer.errors.js';
import { InvalidDocumentError } from '../domain/document.js';
import { LicensePlate } from '../domain/license-plate.js';
import { Vehicle } from '../domain/vehicle.js';
import {
  FakeServiceOrderChecker,
  InMemoryCustomerRepository,
  InMemoryVehicleRepository,
} from '../testing/fakes.js';
import { CreateCustomerUseCase } from './create-customer.use-case.js';
import { DeleteCustomerUseCase } from './delete-customer.use-case.js';
import { FindCustomerByDocumentUseCase } from './find-customer-by-document.use-case.js';
import { GetCustomerUseCase } from './get-customer.use-case.js';
import { ListCustomersUseCase } from './list-customers.use-case.js';
import { UpdateCustomerUseCase } from './update-customer.use-case.js';

const input = {
  name: 'Maria da Silva',
  document: '529.982.247-25',
  email: 'maria@exemplo.com',
  phone: '11987654321',
};

function setup() {
  const customers = new InMemoryCustomerRepository();
  const vehicles = new InMemoryVehicleRepository();
  const checker = new FakeServiceOrderChecker();
  return {
    customers,
    vehicles,
    checker,
    create: new CreateCustomerUseCase(customers),
    get: new GetCustomerUseCase(customers),
    findByDocument: new FindCustomerByDocumentUseCase(customers),
    list: new ListCustomersUseCase(customers),
    update: new UpdateCustomerUseCase(customers),
    remove: new DeleteCustomerUseCase(customers, vehicles, checker),
  };
}

describe('Casos de uso de clientes', () => {
  describe('CreateCustomerUseCase', () => {
    it('cadastra o cliente e devolve o documento formatado', async () => {
      const { create, customers } = setup();

      const output = await create.execute({
        ...input,
        document: '52998224725',
      });

      expect(output.document).toBe('529.982.247-25');
      expect(output.documentType).toBe('CPF');
      expect(await customers.findById(output.id)).not.toBeNull();
    });

    it('rejeita documento inválido', async () => {
      const { create } = setup();

      await expect(
        create.execute({ ...input, document: '529.982.247-26' }),
      ).rejects.toThrow(InvalidDocumentError);
    });

    it('rejeita documento já cadastrado, com ou sem pontuação', async () => {
      const { create } = setup();
      await create.execute(input);

      await expect(
        create.execute({ ...input, document: '52998224725' }),
      ).rejects.toThrow(DocumentAlreadyRegisteredError);
    });
  });

  describe('consultas', () => {
    it('busca por id', async () => {
      const { create, get } = setup();
      const { id } = await create.execute(input);

      expect((await get.execute(id)).name).toBe('Maria da Silva');
    });

    it('responde não encontrado para id inexistente', async () => {
      const { get } = setup();

      await expect(get.execute('id-inexistente')).rejects.toThrow(
        CustomerNotFoundError,
      );
    });

    it('busca por documento, em qualquer formatação', async () => {
      const { create, findByDocument } = setup();
      const { id } = await create.execute(input);

      expect((await findByDocument.execute('52998224725')).id).toBe(id);
    });

    it('responde não encontrado para documento válido sem cadastro', async () => {
      const { findByDocument } = setup();

      await expect(
        findByDocument.execute('11.222.333/0001-81'),
      ).rejects.toThrow(CustomerNotFoundError);
    });

    it('lista com os dados de paginação', async () => {
      const { create, list } = setup();
      await create.execute(input);

      const output = await list.execute({ page: 1, pageSize: 10 });

      expect(output).toMatchObject({ total: 1, page: 1, pageSize: 10 });
      expect(output.items[0]?.document).toBe('529.982.247-25');
    });
  });

  describe('UpdateCustomerUseCase', () => {
    it('altera e persiste os dados do cliente', async () => {
      const { create, update, get } = setup();
      const { id } = await create.execute(input);

      await update.execute(id, {
        name: 'Maria Souza',
        email: null,
        phone: null,
      });

      const reloaded = await get.execute(id);
      expect(reloaded.name).toBe('Maria Souza');
      expect(reloaded.email).toBeNull();
      expect(reloaded.phone).toBeNull();
    });

    it('responde não encontrado para id inexistente', async () => {
      const { update } = setup();

      await expect(
        update.execute('id-inexistente', { name: 'Qualquer' }),
      ).rejects.toThrow(CustomerNotFoundError);
    });
  });

  describe('DeleteCustomerUseCase', () => {
    it('marca o cliente como removido, sem apagar o registro', async () => {
      const { create, remove, customers } = setup();
      const { id } = await create.execute(input);

      await remove.execute(id);

      expect(await customers.findById(id)).toBeNull();
      expect(customers.customers.get(id)?.isDeleted).toBe(true);
    });

    it('responde não encontrado para id inexistente', async () => {
      const { remove } = setup();

      await expect(remove.execute('id-inexistente')).rejects.toThrow(
        CustomerNotFoundError,
      );
    });

    it('responde não encontrado ao remover duas vezes', async () => {
      const { create, remove } = setup();
      const { id } = await create.execute(input);
      await remove.execute(id);

      await expect(remove.execute(id)).rejects.toThrow(CustomerNotFoundError);
    });

    it('bloqueia a remoção de cliente com OS aberta, sem alterar nada', async () => {
      const { create, remove, customers, checker } = setup();
      const { id } = await create.execute(input);
      checker.customersWithOpenOrders.add(id);

      await expect(remove.execute(id)).rejects.toThrow(
        CustomerHasOpenServiceOrdersError,
      );
      expect(await customers.findById(id)).not.toBeNull();
    });

    it('libera o documento para um novo cadastro depois da remoção', async () => {
      const { create, remove } = setup();
      const { id } = await create.execute(input);
      await remove.execute(id);

      const recreated = await create.execute(input);

      expect(recreated.id).not.toBe(id);
    });

    it('bloqueia a remoção de cliente com veículos ativos, sem alterar nada', async () => {
      const { create, vehicles, remove, customers } = setup();
      const { id } = await create.execute(input);
      await vehicles.save(
        Vehicle.create(
          {
            customerId: id,
            plate: LicensePlate.create('BRA2E19'),
            brand: 'Volkswagen',
            model: 'Gol',
            year: 2020,
          },
          new Date(),
        ),
      );

      await expect(remove.execute(id)).rejects.toThrow(
        CustomerHasVehiclesError,
      );
      expect(await customers.findById(id)).not.toBeNull();
    });
  });
});
