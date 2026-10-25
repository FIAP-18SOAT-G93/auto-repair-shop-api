import { Injectable } from '@nestjs/common';
import { VehicleNotFoundError } from '../domain/vehicle.errors.js';
import type { VehicleDetails } from '../domain/vehicle.js';
import { VehicleRepository } from '../domain/vehicle.repository.js';
import { toVehicleOutput, type VehicleOutput } from './vehicle.output.js';

@Injectable()
export class UpdateVehicleUseCase {
  constructor(private readonly vehicles: VehicleRepository) {}

  async execute(id: string, details: VehicleDetails): Promise<VehicleOutput> {
    const vehicle = await this.vehicles.findById(id);
    if (!vehicle) throw new VehicleNotFoundError();

    vehicle.update(details, new Date());
    await this.vehicles.save(vehicle);
    return toVehicleOutput(vehicle);
  }
}
