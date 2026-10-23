import { Role } from './role.js';
import { InvalidUserError, User } from './user.js';

const validProps = {
  name: 'Jorge Christino',
  email: 'gestor@oficina.com',
  passwordHash: '$2b$10$hash-exemplo',
  role: Role.MANAGER,
};

describe('User', () => {
  describe('criação', () => {
    it('cria um usuário com um id novo', () => {
      const user = User.create(validProps);

      expect(user.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(user.name).toBe('Jorge Christino');
      expect(user.email).toBe('gestor@oficina.com');
      expect(user.passwordHash).toBe('$2b$10$hash-exemplo');
      expect(user.role).toBe(Role.MANAGER);
    });

    it('gera ids diferentes para usuários diferentes', () => {
      expect(User.create(validProps).id).not.toBe(User.create(validProps).id);
    });

    it('normaliza o e-mail para minúsculas e sem espaços nas pontas', () => {
      const user = User.create({
        ...validProps,
        email: '  Gestor@Oficina.COM ',
      });
      expect(user.email).toBe('gestor@oficina.com');
    });

    it('remove espaços nas pontas do nome', () => {
      const user = User.create({ ...validProps, name: '  Jorge Christino  ' });
      expect(user.name).toBe('Jorge Christino');
    });

    it('rejeita nome vazio ou só com espaços', () => {
      expect(() => User.create({ ...validProps, name: '   ' })).toThrow(
        InvalidUserError,
      );
    });

    it('rejeita email inválido', () => {
      expect(() => User.create({ ...validProps, email: 'gestor.com' })).toThrow(
        InvalidUserError,
      );
    });
  });

  describe('restaurar', () => {
    it('reconstitui o usuário com o id do banco, sem alterar os dados', () => {
      const user = User.restore('11111111-1111-1111-1111-111111111111', {
        ...validProps,
        email: 'Gestor@Oficina.com',
      });

      expect(user.id).toBe('11111111-1111-1111-1111-111111111111');
      expect(user.email).toBe('Gestor@Oficina.com');
    });
  });
});
