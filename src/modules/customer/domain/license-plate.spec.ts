import { InvalidLicensePlateError, LicensePlate } from './license-plate.js';

describe('LicensePlate', () => {
  describe('formato antigo', () => {
    it('aceita a placa e guarda só letras e números, em maiúsculas', () => {
      const plate = LicensePlate.create('abc-1234');

      expect(plate.value).toBe('ABC1234');
      expect(plate.type).toBe('OLD');
    });

    it('formata com hífen', () => {
      expect(LicensePlate.create('ABC1234').format()).toBe('ABC-1234');
    });
  });

  describe('formato Mercosul', () => {
    it('aceita a placa em qualquer caixa e com espaços', () => {
      const plate = LicensePlate.create(' bra 2e19 ');

      expect(plate.value).toBe('BRA2E19');
      expect(plate.type).toBe('MERCOSUL');
    });

    it('formata sem hífen', () => {
      expect(LicensePlate.create('BRA2E19').format()).toBe('BRA2E19');
    });
  });

  describe('placas inválidas', () => {
    it.each([
      ['', 'vazia'],
      ['ABC123', 'curta demais'],
      ['ABC12345', 'longa demais'],
      ['AB12345', 'só duas letras no início'],
      ['ABCD123', 'quatro letras no início'],
      ['1BC1234', 'número na primeira posição'],
      ['ABC1DD3', 'letra na sexta posição'],
      ['ABC-12#4', 'caractere especial'],
    ])('rejeita "%s" (%s)', (input) => {
      expect(() => LicensePlate.create(input)).toThrow(
        InvalidLicensePlateError,
      );
    });
  });

  describe('igualdade', () => {
    it('é igual a outra placa com o mesmo valor, formatada ou não', () => {
      expect(
        LicensePlate.create('ABC-1234').equals(LicensePlate.create('abc1234')),
      ).toBe(true);
    });
  });
});
