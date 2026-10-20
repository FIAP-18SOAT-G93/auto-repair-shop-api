import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ConflictError,
  DomainError,
  NotFoundError,
  ValidationError,
} from '../../domain/domain-error.js';

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter<DomainError> {
  catch(error: DomainError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = this.toHttpStatus(error);

    response.status(status).json({
      statusCode: status,
      error: error.name,
      message: error.message,
    });
  }

  private toHttpStatus(error: DomainError): HttpStatus {
    if (error instanceof ValidationError) return HttpStatus.BAD_REQUEST;
    if (error instanceof NotFoundError) return HttpStatus.NOT_FOUND;
    if (error instanceof ConflictError) return HttpStatus.CONFLICT;
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}
