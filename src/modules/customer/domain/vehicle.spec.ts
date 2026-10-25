import { LicensePlate } from './license-plate.js';
import {
  InvalidVehicleError,
  VehicleAlreadyDeletedError,
} from './vehicle.errors.js';
import { Vehicle } from './vehicle.js';

const NOW = new Date('2026-10-25T12:00:00Z');

const validInput = {
  customerId: '11111111-1111-1111-1111-111111111111',
  plate: LicensePlate.create('BRA2E19'),
  brand: ' Volkswagen ',
  model: ' Gol ',
  year: 2020,
};

describe('Vehicle', () => {
  describe('create', () => {
    it('cria o veículo com id novo, ligado ao cliente, com os textos sem espaços nas pontas', () => {
      const vehicle = Vehicle.create(validInput, NOW);

      expect(vehicle.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(vehicle.customerId).toBe(validInput.customerId);
      expect(vehicle.plate.value).toBe('BRA2E19');
      expect(vehicle.brand).toBe('Volkswagen');
      expect(vehicle.model).toBe('Gol');
      expect(vehicle.year).toBe(2020);
      expect(vehicle.isDeleted).toBe(false);
    });

    it.each([
      ['brand', ''],
      ['brand', '   '],
      ['model', ''],
    ])('rejeita %s vazio ("%s")', (field, value) => {
      expect(() =>
        Vehicle.create({ ...validInput, [field]: value }, NOW),
      ).toThrow(InvalidVehicleError);
    });
  });

  describe('ano', () => {
    it('aceita o ano seguinte ao atual (ano-modelo)', () => {
      expect(Vehicle.create({ ...validInput, year: 2027 }, NOW).year).toBe(
        2027,
      );
    });

    it('aceita o limite inferior, 1900', () => {
      expect(Vehicle.create({ ...validInput, year: 1900 }, NOW).year).toBe(
        1900,
      );
    });

    it.each([
      [2028, 'dois anos à frente'],
      [1899, 'antes de 1900'],
      [2020.5, 'não inteiro'],
    ])('rejeita %s (%s)', (year) => {
      expect(() => Vehicle.create({ ...validInput, year }, NOW)).toThrow(
        InvalidVehicleError,
      );
    });
  });

  describe('update', () => {
    it('altera marca, modelo e ano, mas mantém a placa e o cliente', () => {
      const vehicle = Vehicle.create(validInput, NOW);

      vehicle.update({ brand: 'Fiat', model: 'Uno', year: 2015 }, NOW);

      expect(vehicle.brand).toBe('Fiat');
      expect(vehicle.year).toBe(2015);
      expect(vehicle.plate.value).toBe('BRA2E19');
      expect(vehicle.customerId).toBe(validInput.customerId);
    });

    it('aplica as mesmas validações da criação', () => {
      const vehicle = Vehicle.create(validInput, NOW);

      expect(() =>
        vehicle.update({ brand: 'Fiat', model: 'Uno', year: 1800 }, NOW),
      ).toThrow(InvalidVehicleError);
    });
  });

  describe('restore', () => {
    it('reconstitui o veículo do banco, inclusive removido', () => {
      const deletedAt = new Date('2026-10-01T00:00:00Z');

      const vehicle = Vehicle.restore('22222222-2222-2222-2222-222222222222', {
        customerId: validInput.customerId,
        plate: validInput.plate,
        brand: 'Volkswagen',
        model: 'Gol',
        year: 2020,
        deletedAt,
      });

      expect(vehicle.id).toBe('22222222-2222-2222-2222-222222222222');
      expect(vehicle.deletedAt).toEqual(deletedAt);
    });
  });

  describe('delete', () => {
    it('marca o veículo como removido', () => {
      const vehicle = Vehicle.create(validInput, NOW);

      vehicle.delete(NOW);

      expect(vehicle.isDeleted).toBe(true);
      expect(vehicle.deletedAt).toEqual(NOW);
    });

    it('não permite remover duas vezes', () => {
      const vehicle = Vehicle.create(validInput, NOW);
      vehicle.delete(NOW);

      expect(() => vehicle.delete(NOW)).toThrow(VehicleAlreadyDeletedError);
    });
  });
});
