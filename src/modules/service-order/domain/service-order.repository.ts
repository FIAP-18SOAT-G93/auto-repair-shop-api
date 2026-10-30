import type { ServiceOrderStatus } from './service-order-status.js';
import type { ServiceOrder } from './service-order.js';

export interface ServiceOrderFilter {
  status?: ServiceOrderStatus;
  customerId?: string;
  openedFrom?: Date;
  openedBefore?: Date;
}

export interface ServiceOrderPage {
  items: ServiceOrder[];
  total: number;
}

export abstract class ServiceOrderRepository {
  abstract nextNumber(): Promise<number>;
  abstract save(order: ServiceOrder): Promise<void>;
  abstract findById(id: string): Promise<ServiceOrder | null>;
  abstract findByIdForUpdate(id: string): Promise<ServiceOrder | null>;
  abstract findOpenByVehicle(vehicleId: string): Promise<ServiceOrder | null>;
  abstract existsOpenForCustomer(customerId: string): Promise<boolean>;
  abstract list(
    filter: ServiceOrderFilter,
    page: number,
    pageSize: number,
  ): Promise<ServiceOrderPage>;
}
