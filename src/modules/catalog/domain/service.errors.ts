import {
  NotFoundError,
  ValidationError,
} from '../../../shared/domain/domain-error.js';

export class InvalidServiceError extends ValidationError {}

export class ServiceNotFoundError extends NotFoundError {
  constructor() {
    super('Serviço não encontrado');
  }
}
