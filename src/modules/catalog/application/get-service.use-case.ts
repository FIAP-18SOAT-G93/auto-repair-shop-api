import { Injectable } from '@nestjs/common';
import { ServiceNotFoundError } from '../domain/service.errors.js';
import { ServiceRepository } from '../domain/service.repository.js';
import { type ServiceOutput, toServiceOutput } from './service.output.js';

@Injectable()
export class GetServiceUseCase {
  constructor(private readonly services: ServiceRepository) {}

  async execute(id: string): Promise<ServiceOutput> {
    const service = await this.services.findById(id);
    if (!service) throw new ServiceNotFoundError();
    return toServiceOutput(service);
  }
}
