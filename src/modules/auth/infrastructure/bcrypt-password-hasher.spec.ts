import bcrypt from 'bcrypt';
import { BcryptPasswordHasher } from './bcrypt-password-hasher.js';

describe('BcryptPasswordHasher', () => {
  // Custo mínimo do bcrypt (4) para os testes ficarem rápidos.
  const hasher = new BcryptPasswordHasher(4);

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('gera um hash bcrypt diferente da senha', async () => {
    const hash = await hasher.hash('Oficina@123');

    expect(hash).not.toBe('Oficina@123');
    expect(hash).toMatch(/^\$2[aby]\$/);
  });

  it('gera hashes diferentes para a mesma senha (salt aleatório)', async () => {
    expect(await hasher.hash('Oficina@123')).not.toBe(
      await hasher.hash('Oficina@123'),
    );
  });

  it('confirma a senha correta', async () => {
    const hash = await hasher.hash('Oficina@123');
    expect(await hasher.compare('Oficina@123', hash)).toBe(true);
  });

  it('recusa a senha errada', async () => {
    const hash = await hasher.hash('Oficina@123');
    expect(await hasher.compare('outra-senha', hash)).toBe(false);
  });

  it('com hash null, recusa e ainda assim executa uma comparação bcrypt', async () => {
    const compareSpy = vi.spyOn(bcrypt, 'compare');

    expect(await hasher.compare('qualquer', null)).toBe(false);
    expect(compareSpy).toHaveBeenCalledTimes(1);
  });
});
