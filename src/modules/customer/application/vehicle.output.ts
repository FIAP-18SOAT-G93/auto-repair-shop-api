import type { LicensePlateType } from '../domain/license-plate.js';
import type { Vehicle } from '../domain/vehicle.js';

export interface VehicleOutput {
  id: string;
  customerId: string;
  plate: string;
  plateType: LicensePlateType;
  brand: string;
  model: string;
  year: number;
}

export function toVehicleOutput(vehicle: Vehicle): VehicleOutput {
  return {
    id: vehicle.id,
    customerId: vehicle.customerId,
    plate: vehicle.plate.format(),
    plateType: vehicle.plate.type,
    brand: vehicle.brand,
    model: vehicle.model,
    year: vehicle.year,
  };
}
