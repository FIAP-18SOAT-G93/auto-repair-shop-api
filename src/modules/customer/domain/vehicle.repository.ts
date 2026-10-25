import type { LicensePlate } from './license-plate.js';
import type { Vehicle } from './vehicle.js';

export interface VehicleFilter {
  customerId?: string;
}

export interface VehiclePage {
  items: Vehicle[];
  total: number;
}

/**
 * Coleção dos veículos ativos. Os removidos (soft delete) continuam no banco
 * para o histórico, mas nenhuma busca os devolve.
 */
export abstract class VehicleRepository {
  abstract save(vehicle: Vehicle): Promise<void>;
  abstract findById(id: string): Promise<Vehicle | null>;
  abstract findByPlate(plate: LicensePlate): Promise<Vehicle | null>;
  abstract list(
    filter: VehicleFilter,
    page: number,
    pageSize: number,
  ): Promise<VehiclePage>;
  /** Usado para impedir a remoção de um cliente que ainda tem veículos. */
  abstract existsForCustomer(customerId: string): Promise<boolean>;
}
