import { Injectable } from '@nestjs/common';
import { LicensePlate } from '../domain/license-plate.js';
import { VehicleNotFoundError } from '../domain/vehicle.errors.js';
import { VehicleRepository } from '../domain/vehicle.repository.js';
import { toVehicleOutput, type VehicleOutput } from './vehicle.output.js';

@Injectable()
export class FindVehicleByPlateUseCase {
  constructor(private readonly vehicles: VehicleRepository) {}

  async execute(plate: string): Promise<VehicleOutput> {
    const vehicle = await this.vehicles.findByPlate(LicensePlate.create(plate));
    if (!vehicle) throw new VehicleNotFoundError();
    return toVehicleOutput(vehicle);
  }
}
