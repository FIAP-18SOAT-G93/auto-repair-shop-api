import { InvalidMoneyError } from '../../../shared/domain/money.js';
import {
  InvalidServiceError,
  ServiceNotFoundError,
} from '../domain/service.errors.js';
import { InMemoryServiceRepository } from '../testing/fakes.js';
import { CreateServiceUseCase } from './create-service.use-case.js';
import { DeleteServiceUseCase } from './delete-service.use-case.js';
import { GetServiceUseCase } from './get-service.use-case.js';
import { ListServicesUseCase } from './list-services.use-case.js';
import { UpdateServiceUseCase } from './update-service.use-case.js';

const input = {
  name: 'Alinhamento',
  description: 'Alinhamento das rodas dianteiras',
  price: 89.9,
  estimatedMinutes: 40,
};

function setup() {
  const services = new InMemoryServiceRepository();
  return {
    services,
    create: new CreateServiceUseCase(services),
    get: new GetServiceUseCase(services),
    list: new ListServicesUseCase(services),
    update: new UpdateServiceUseCase(services),
    remove: new DeleteServiceUseCase(services),
  };
}

describe('Casos de uso do catálogo de serviços', () => {
  describe('CreateServiceUseCase', () => {
    it('cadastra o serviço, devolvendo o preço em reais', async () => {
      const { create, services } = setup();

      const output = await create.execute(input);

      expect(output).toMatchObject({
        name: 'Alinhamento',
        price: 89.9,
        estimatedMinutes: 40,
      });
      expect((await services.findById(output.id))?.price.cents).toBe(8990);
    });

    it.each<[number, string]>([
      [-1, 'negativo'],
      [10.555, 'com três casas decimais'],
    ])('rejeita preço %s (%s)', async (price) => {
      const { create } = setup();

      await expect(create.execute({ ...input, price })).rejects.toThrow(
        InvalidMoneyError,
      );
    });

    it('rejeita dados inválidos sem gravar nada', async () => {
      const { create, services } = setup();

      await expect(
        create.execute({ ...input, estimatedMinutes: 0 }),
      ).rejects.toThrow(InvalidServiceError);
      expect(services.services.size).toBe(0);
    });
  });

  describe('consultas', () => {
    it('detalha o serviço', async () => {
      const { create, get } = setup();
      const { id } = await create.execute(input);

      expect(await get.execute(id)).toMatchObject({ id, name: 'Alinhamento' });
    });

    it('responde não encontrado para id inexistente', async () => {
      const { get } = setup();

      await expect(get.execute('id-inexistente')).rejects.toThrow(
        ServiceNotFoundError,
      );
    });

    it('lista com os dados de paginação', async () => {
      const { create, list } = setup();
      await create.execute(input);
      await create.execute({ ...input, name: 'Balanceamento' });

      const output = await list.execute({ page: 1, pageSize: 10 });

      expect(output).toMatchObject({ total: 2, page: 1, pageSize: 10 });
    });
  });

  describe('UpdateServiceUseCase', () => {
    it('altera e persiste os dados do serviço', async () => {
      const { create, update, get } = setup();
      const { id } = await create.execute(input);

      await update.execute(id, {
        name: 'Alinhamento 3D',
        description: null,
        price: 120,
        estimatedMinutes: 50,
      });

      expect(await get.execute(id)).toMatchObject({
        name: 'Alinhamento 3D',
        description: null,
        price: 120,
        estimatedMinutes: 50,
      });
    });

    it('responde não encontrado para id inexistente', async () => {
      const { update } = setup();

      await expect(update.execute('id-inexistente', input)).rejects.toThrow(
        ServiceNotFoundError,
      );
    });
  });

  describe('DeleteServiceUseCase', () => {
    it('apaga o serviço', async () => {
      const { create, remove, services } = setup();
      const { id } = await create.execute(input);

      await remove.execute(id);

      expect(services.services.has(id)).toBe(false);
    });

    it('tira o serviço removido da listagem', async () => {
      const { create, remove, list } = setup();
      const { id } = await create.execute(input);
      await create.execute({ ...input, name: 'Balanceamento' });

      await remove.execute(id);

      const output = await list.execute({ page: 1, pageSize: 10 });
      expect(output.total).toBe(1);
      expect(output.items.map((s) => s.name)).toEqual(['Balanceamento']);
    });

    it('responde não encontrado para id inexistente', async () => {
      const { remove } = setup();

      await expect(remove.execute('id-inexistente')).rejects.toThrow(
        ServiceNotFoundError,
      );
    });

    it('responde não encontrado ao remover duas vezes', async () => {
      const { create, remove } = setup();
      const { id } = await create.execute(input);
      await remove.execute(id);

      await expect(remove.execute(id)).rejects.toThrow(ServiceNotFoundError);
    });
  });
});
