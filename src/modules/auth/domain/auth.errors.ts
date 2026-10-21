import {
  AuthenticationError,
  ConflictError,
} from '../../../shared/domain/domain-error.js';

export class InvalidCredentialsError extends AuthenticationError {
  constructor() {
    super('E-mail ou senha inválidos');
  }
}

export class EmailAlreadyInUseError extends ConflictError {
  constructor() {
    super('Já existe um usuário com este e-mail');
  }
}
