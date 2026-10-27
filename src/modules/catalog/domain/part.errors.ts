import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../../../shared/domain/domain-error.js';

export class InvalidPartError extends ValidationError {}

export class PartNotFoundError extends NotFoundError {
  constructor() {
    super('Peça não encontrada');
  }
}

export class PartOutOfStockError extends ConflictError {
  constructor() {
    super('Peça indisponível em estoque');
  }
}
