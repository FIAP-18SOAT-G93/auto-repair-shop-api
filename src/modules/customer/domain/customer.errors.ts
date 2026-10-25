import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../../../shared/domain/domain-error.js';

export class InvalidCustomerError extends ValidationError {}

export class CustomerNotFoundError extends NotFoundError {
  constructor() {
    super('Cliente não encontrado');
  }
}

export class DocumentAlreadyRegisteredError extends ConflictError {
  constructor() {
    super('Já existe um cliente cadastrado com este CPF/CNPJ');
  }
}

export class CustomerHasOpenServiceOrdersError extends ConflictError {
  constructor() {
    super('O cliente possui ordens de serviço abertas e não pode ser removido');
  }
}

export class CustomerAlreadyDeletedError extends ConflictError {
  constructor() {
    super('O cliente já foi removido');
  }
}

export class CustomerHasVehiclesError extends ConflictError {
  constructor() {
    super('O cliente possui veículos cadastrados e não pode ser removido');
  }
}
