import { UserNotFoundError } from '../domain/auth.errors.js';
import { Role } from '../domain/role.js';
import { User } from '../domain/user.js';
import { InMemoryUserRepository } from '../testing/fakes.js';
import { GetCurrentUserUseCase } from './get-current-user.use-case.js';

describe('GetCurrentUserUseCase', () => {
  it('devolve os dados públicos do usuário, sem o hash da senha', async () => {
    const users = new InMemoryUserRepository();
    const user = User.create({
      name: 'Marco Antônio',
      email: 'mecanico@oficina.com',
      passwordHash: 'hashed:senha',
      role: Role.MECHANIC,
    });
    await users.save(user);

    const output = await new GetCurrentUserUseCase(users).execute(user.id);

    expect(output).toEqual({
      id: user.id,
      name: 'Marco Antônio',
      email: 'mecanico@oficina.com',
      role: Role.MECHANIC,
    });
  });

  it('rejeita um id que não existe mais', async () => {
    const useCase = new GetCurrentUserUseCase(new InMemoryUserRepository());

    await expect(useCase.execute('id-inexistente')).rejects.toThrow(
      UserNotFoundError,
    );
  });
});
