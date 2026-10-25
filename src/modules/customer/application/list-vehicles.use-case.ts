import { Injectable } from '@nestjs/common';
import { VehicleRepository } from '../domain/vehicle.repository.js';
import { toVehicleOutput, type VehicleOutput } from './vehicle.output.js';

export interface ListVehiclesInput {
  customerId?: string;
  page: number;
  pageSize: number;
}

export interface ListVehiclesOutput {
  items: VehicleOutput[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable()
export class ListVehiclesUseCase {
  constructor(private readonly vehicles: VehicleRepository) {}

  async execute({
    customerId,
    page,
    pageSize,
  }: ListVehiclesInput): Promise<ListVehiclesOutput> {
    const { items, total } = await this.vehicles.list(
      { customerId },
      page,
      pageSize,
    );
    return { items: items.map(toVehicleOutput), total, page, pageSize };
  }
}
