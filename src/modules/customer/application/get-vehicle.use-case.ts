import { Injectable } from '@nestjs/common';
import { VehicleNotFoundError } from '../domain/vehicle.errors.js';
import { VehicleRepository } from '../domain/vehicle.repository.js';
import { toVehicleOutput, type VehicleOutput } from './vehicle.output.js';

@Injectable()
export class GetVehicleUseCase {
  constructor(private readonly vehicles: VehicleRepository) {}

  async execute(id: string): Promise<VehicleOutput> {
    const vehicle = await this.vehicles.findById(id);
    if (!vehicle) throw new VehicleNotFoundError();
    return toVehicleOutput(vehicle);
  }
}
