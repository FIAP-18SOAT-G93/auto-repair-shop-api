import { InvalidCredentialsError } from '../domain/auth.errors.js';
import { Role } from '../domain/role.js';
import { User } from '../domain/user.js';
import {
  FakeAccessTokenIssuer,
  FakePasswordHasher,
  InMemoryUserRepository,
} from '../testing/fakes.js';
import { LoginUseCase } from './login.use-case.js';

async function setup() {
  const users = new InMemoryUserRepository();
  const hasher = new FakePasswordHasher();
  const user = User.create({
    name: 'Jorge Christino',
    email: 'gestor@oficina.com',
    passwordHash: await hasher.hash('senha-correta'),
    role: Role.MANAGER,
  });
  await users.save(user);
  const compareSpy = vi.spyOn(hasher, 'compare');
  const useCase = new LoginUseCase(users, hasher, new FakeAccessTokenIssuer());
  return { user, compareSpy, useCase };
}

describe('LoginUseCase', () => {
  it('devolve um token com o id e a função do usuário', async () => {
    const { user, useCase } = await setup();

    const { accessToken } = await useCase.execute({
      email: 'gestor@oficina.com',
      password: 'senha-correta',
    });

    expect(accessToken).toBe(`token:${user.id}:MANAGER`);
  });

  it('aceita o e-mail com maiúsculas e espaços', async () => {
    const { user, useCase } = await setup();

    const { accessToken } = await useCase.execute({
      email: '  Gestor@Oficina.COM ',
      password: 'senha-correta',
    });

    expect(accessToken).toBe(`token:${user.id}:MANAGER`);
  });

  it('rejeita senha errada', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({ email: 'gestor@oficina.com', password: 'errada' }),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it('responde e-mail inexistente com o mesmo erro e a mesma mensagem da senha errada', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({ email: 'gestor@oficina.com', password: 'errada' }),
    ).rejects.toThrow('E-mail ou senha inválidos');
    await expect(
      useCase.execute({ email: 'ninguem@oficina.com', password: 'qualquer' }),
    ).rejects.toThrow('E-mail ou senha inválidos');
  });

  it('compara a senha mesmo quando o e-mail não existe', async () => {
    const { compareSpy, useCase } = await setup();

    await expect(
      useCase.execute({ email: 'ninguem@oficina.com', password: 'qualquer' }),
    ).rejects.toThrow(InvalidCredentialsError);

    expect(compareSpy).toHaveBeenCalledWith('qualquer', null);
  });
});
