import {
  ConflictError,
  ValidationError,
} from '../../../shared/domain/domain-error.js';

export class InvalidServiceOrderError extends ValidationError {}

export class InvalidStatusTransitionError extends ConflictError {
  constructor(from: string, to: string) {
    super(`A OS não pode passar de "${from}" para "${to}"`);
  }
}

export class QuoteAlreadyDecidedError extends ConflictError {
  constructor() {
    super('O orçamento já foi aprovado ou rejeitado');
  }
}
