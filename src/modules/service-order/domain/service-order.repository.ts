import type { ServiceOrder } from './service-order.js';

export abstract class ServiceOrderRepository {
  abstract nextNumber(): Promise<number>;
  abstract save(order: ServiceOrder): Promise<void>;
  abstract findById(id: string): Promise<ServiceOrder | null>;
  abstract findByIdForUpdate(id: string): Promise<ServiceOrder | null>;
  abstract findOpenByVehicle(vehicleId: string): Promise<ServiceOrder | null>;
  abstract existsOpenForCustomer(customerId: string): Promise<boolean>;
}
