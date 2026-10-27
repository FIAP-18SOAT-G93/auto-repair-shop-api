import { Injectable } from '@nestjs/common';
import { ServiceNotFoundError } from '../domain/service.errors.js';
import { ServiceRepository } from '../domain/service.repository.js';
import { type ServiceInput, toServiceDetails } from './service.input.js';
import { type ServiceOutput, toServiceOutput } from './service.output.js';

@Injectable()
export class UpdateServiceUseCase {
  constructor(private readonly services: ServiceRepository) {}

  async execute(id: string, input: ServiceInput): Promise<ServiceOutput> {
    const service = await this.services.findById(id);
    if (!service) throw new ServiceNotFoundError();

    service.update(toServiceDetails(input));
    await this.services.save(service);
    return toServiceOutput(service);
  }
}
