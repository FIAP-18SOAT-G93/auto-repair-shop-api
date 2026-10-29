import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../../../shared/domain/domain-error.js';

export class InvalidServiceOrderError extends ValidationError {}

export class InvalidStatusTransitionError extends ConflictError {
  constructor(from: string, to: string) {
    super(`A OS não pode passar de "${from}" para "${to}"`);
  }
}

export class ServiceOrderActionNotAllowedError extends ConflictError {
  constructor(action: string, status: string) {
    super(`Não é possível ${action}: a OS está "${status}"`);
  }
}

export class ServiceOrderWithoutItemsError extends ConflictError {
  constructor() {
    super('Inclua ao menos um serviço ou peça antes de gerar o orçamento');
  }
}

export class QuoteAlreadyDecidedError extends ConflictError {
  constructor() {
    super('O orçamento já foi aprovado ou rejeitado');
  }
}

export class ServiceOrderNotFoundError extends NotFoundError {
  constructor() {
    super('Ordem de serviço não encontrada');
  }
}

export class VehicleHasOpenServiceOrderError extends ConflictError {
  constructor() {
    super('O veículo já possui uma ordem de serviço aberta');
  }
}
