import {
  AuthenticationError,
  ConflictError,
  NotFoundError,
} from '../../../shared/domain/domain-error.js';

export class InvalidCredentialsError extends AuthenticationError {
  constructor() {
    super('E-mail ou senha inválidos');
  }
}

export class InvalidCustomerCredentialsError extends AuthenticationError {
  constructor() {
    super('Documento ou código de acompanhamento inválidos');
  }
}

export class EmailAlreadyInUseError extends ConflictError {
  constructor() {
    super('Já existe um usuário com este e-mail');
  }
}

export class UserNotFoundError extends NotFoundError {
  constructor() {
    super('Usuário não encontrado');
  }
}
