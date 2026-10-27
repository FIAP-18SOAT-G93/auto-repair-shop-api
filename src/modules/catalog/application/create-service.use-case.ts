import { Injectable } from '@nestjs/common';
import { Service } from '../domain/service.js';
import { ServiceRepository } from '../domain/service.repository.js';
import { type ServiceInput, toServiceDetails } from './service.input.js';
import { type ServiceOutput, toServiceOutput } from './service.output.js';

@Injectable()
export class CreateServiceUseCase {
  constructor(private readonly services: ServiceRepository) {}

  async execute(input: ServiceInput): Promise<ServiceOutput> {
    const service = Service.create(toServiceDetails(input));
    await this.services.save(service);
    return toServiceOutput(service);
  }
}
