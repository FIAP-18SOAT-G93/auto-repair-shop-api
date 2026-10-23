import { EmailAlreadyInUseError } from '../domain/auth.errors.js';
import { Role } from '../domain/role.js';
import {
  FakePasswordHasher,
  InMemoryUserRepository,
} from '../testing/fakes.js';
import { CreateUserUseCase } from './create-user.use-case.js';

const input = {
  name: 'Marco Antônio',
  email: 'Mecanico@Oficina.com',
  password: 'senha-forte-123',
  role: Role.MECHANIC,
};

function setup() {
  const users = new InMemoryUserRepository();
  const useCase = new CreateUserUseCase(users, new FakePasswordHasher());
  return { users, useCase };
}

describe('CreateUserUseCase', () => {
  it('cadastra o usuário com o e-mail normalizado e devolve o id', async () => {
    const { users, useCase } = setup();

    const { id } = await useCase.execute(input);

    const saved = await users.findById(id);
    expect(saved?.email).toBe('mecanico@oficina.com');
    expect(saved?.role).toBe(Role.MECHANIC);
  });

  it('guarda o hash da senha, e não a senha em texto', async () => {
    const { users, useCase } = setup();

    const { id } = await useCase.execute(input);

    const saved = await users.findById(id);
    expect(saved?.passwordHash).toBe('hashed:senha-forte-123');
  });

  it('rejeita e-mail já cadastrado, sem diferenciar maiúsculas', async () => {
    const { useCase } = setup();
    await useCase.execute(input);

    await expect(
      useCase.execute({ ...input, email: 'MECANICO@oficina.com' }),
    ).rejects.toThrow(EmailAlreadyInUseError);
  });
});
