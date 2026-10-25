import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../../../shared/domain/domain-error.js';

export class InvalidVehicleError extends ValidationError {}

export class VehicleNotFoundError extends NotFoundError {
  constructor() {
    super('Veículo não encontrado');
  }
}

export class LicensePlateAlreadyRegisteredError extends ConflictError {
  constructor() {
    super('Já existe um veículo cadastrado com esta placa');
  }
}

export class VehicleAlreadyDeletedError extends ConflictError {
  constructor() {
    super('O veículo já foi removido');
  }
}

export class VehicleHasOpenServiceOrdersError extends ConflictError {
  constructor() {
    super('O veículo possui ordens de serviço abertas e não pode ser removido');
  }
}
