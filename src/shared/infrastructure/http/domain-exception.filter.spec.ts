import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import {
  AuthenticationError,
  ConflictError,
  DomainError,
  NotFoundError,
  ValidationError,
} from '../../domain/domain-error.js';
import { DomainExceptionFilter } from './domain-exception.filter.js';

class InvalidThingError extends ValidationError {}
class ThingNotFoundError extends NotFoundError {}
class ThingConflictError extends ConflictError {}
class UncategorizedError extends DomainError {}
class InvalidCredentialsTestError extends AuthenticationError {}

function createHost() {
  const response = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  const host = {
    switchToHttp: () => ({ getResponse: () => response }),
  } as unknown as ArgumentsHost;
  return { host, response };
}

describe('DomainExceptionFilter', () => {
  const filter = new DomainExceptionFilter();

  it.each([
    [new InvalidThingError('dado inválido'), HttpStatus.BAD_REQUEST],
    [new ThingNotFoundError('não encontrado'), HttpStatus.NOT_FOUND],
    [new ThingConflictError('em conflito'), HttpStatus.CONFLICT],
    [new UncategorizedError('sem categoria'), HttpStatus.INTERNAL_SERVER_ERROR],
    [
      new InvalidCredentialsTestError('credenciais ausentes/inválidas'),
      HttpStatus.UNAUTHORIZED,
    ],
  ])('converte %s no status %i', (error, status) => {
    const { host, response } = createHost();

    filter.catch(error, host);

    expect(response.status).toHaveBeenCalledWith(status);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: status,
      error: error.name,
      message: error.message,
    });
  });
});
