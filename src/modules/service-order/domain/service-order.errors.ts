import { ConflictError } from '../../../shared/domain/domain-error.js';

export class InvalidStatusTransitionError extends ConflictError {
  constructor(from: string, to: string) {
    super(`A OS não pode passar de "${from}" para "${to}"`);
  }
}
