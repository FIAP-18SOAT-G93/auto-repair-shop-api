import {
  CustomerAlreadyDeletedError,
  InvalidCustomerError,
} from './customer.errors.js';
import { Customer } from './customer.js';
import { Document } from './document.js';

const validInput = {
  name: 'Maria da Silva',
  document: Document.create('529.982.247-25'),
  email: 'Maria@Exemplo.com',
  phone: '(11) 98765-4321',
};

describe('Customer', () => {
  describe('create', () => {
    it('cria um cliente com id novo e os dados normalizados', () => {
      const customer = Customer.create(validInput);

      expect(customer.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(customer.name).toBe('Maria da Silva');
      expect(customer.document.value).toBe('52998224725');
      expect(customer.email).toBe('maria@exemplo.com');
      expect(customer.phone).toBe('11987654321');
      expect(customer.isDeleted).toBe(false);
    });

    it('aceita cliente sem e-mail e sem telefone', () => {
      const customer = Customer.create({
        name: 'João',
        document: validInput.document,
      });

      expect(customer.email).toBeNull();
      expect(customer.phone).toBeNull();
    });

    it('rejeita nome vazio', () => {
      expect(() => Customer.create({ ...validInput, name: '  ' })).toThrow(
        InvalidCustomerError,
      );
    });

    it('rejeita email inválido', () => {
      expect(() =>
        Customer.create({ ...validInput, email: 'maria.com' }),
      ).toThrow(InvalidCustomerError);
    });

    it('rejeita telefone com quantidade de dígitos inválida', () => {
      expect(() => Customer.create({ ...validInput, phone: '1234' })).toThrow(
        InvalidCustomerError,
      );
    });
  });

  describe('restore', () => {
    it('reconstitui o cliente com os dados do banco, sem normalizar, inclusive removido', () => {
      const deletedAt = new Date('2026-10-01T12:00:00Z');

      const customer = Customer.restore(
        '11111111-1111-1111-1111-111111111111',
        {
          name: 'Maria da Silva',
          document: Document.create('52998224725'),
          email: 'Maria@Exemplo.com',
          phone: null,
          deletedAt,
        },
      );

      expect(customer.id).toBe('11111111-1111-1111-1111-111111111111');
      expect(customer.email).toBe('Maria@Exemplo.com');
      expect(customer.isDeleted).toBe(true);
      expect(customer.deletedAt).toEqual(deletedAt);
    });
  });

  describe('update', () => {
    it('altera nome e contatos, mas mantém o documento', () => {
      const customer = Customer.create(validInput);

      customer.update({
        name: 'Maria Souza',
        email: null,
        phone: '1133334444',
      });

      expect(customer.name).toBe('Maria Souza');
      expect(customer.email).toBeNull();
      expect(customer.phone).toBe('1133334444');
      expect(customer.document.value).toBe('52998224725');
    });

    it('rejeita nome vazio ao atualizar', () => {
      const customer = Customer.create(validInput);
      expect(() => customer.update({ ...validInput, name: '  ' })).toThrow(
        InvalidCustomerError,
      );
    });

    it('rejeita email inválido ao atualizar', () => {
      const customer = Customer.create(validInput);
      expect(() =>
        customer.update({ ...validInput, email: 'maria.com' }),
      ).toThrow(InvalidCustomerError);
    });

    it('rejeita telefone com quantidade de dígitos inválida ao atualizar', () => {
      const customer = Customer.create(validInput);
      expect(() => customer.update({ ...validInput, phone: '1234' })).toThrow(
        InvalidCustomerError,
      );
    });
  });

  describe('delete', () => {
    it('marca o cliente como removido, com a data da remoção', () => {
      const customer = Customer.create(validInput);
      const now = new Date('2026-10-22T10:00:00Z');

      customer.delete(now);

      expect(customer.isDeleted).toBe(true);
      expect(customer.deletedAt).toEqual(now);
    });

    it('não permite remover duas vezes', () => {
      const customer = Customer.create(validInput);
      customer.delete(new Date());

      expect(() => customer.delete(new Date())).toThrow(
        CustomerAlreadyDeletedError,
      );
    });
  });
});
