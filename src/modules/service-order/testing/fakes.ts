import { VehicleHasOpenServiceOrderError } from '../domain/service-order.errors.js';
import { ServiceOrder } from '../domain/service-order.js';
import { ServiceOrderRepository } from '../domain/service-order.repository.js';

export class InMemoryServiceOrderRepository implements ServiceOrderRepository {
  readonly orders = new Map<string, ServiceOrder>();
  private lastNumber = 0;

  async nextNumber(): Promise<number> {
    this.lastNumber += 1;
    return this.lastNumber;
  }

  async save(order: ServiceOrder): Promise<void> {
    const conflict = this.open().find(
      (other) => other.vehicleId === order.vehicleId && other.id !== order.id,
    );
    if (order.isOpen && conflict) throw new VehicleHasOpenServiceOrderError();
    this.orders.set(order.id, copy(order));
  }

  async findById(id: string): Promise<ServiceOrder | null> {
    const order = this.orders.get(id);
    return order ? copy(order) : null;
  }

  async findOpenByVehicle(vehicleId: string): Promise<ServiceOrder | null> {
    const order = this.open().find((o) => o.vehicleId === vehicleId);
    return order ? copy(order) : null;
  }

  async existsOpenForCustomer(customerId: string): Promise<boolean> {
    return this.open().some((o) => o.customerId === customerId);
  }

  private open(): ServiceOrder[] {
    return [...this.orders.values()].filter((o) => o.isOpen);
  }
}

function copy(order: ServiceOrder): ServiceOrder {
  return ServiceOrder.restore(order.id, {
    number: order.number,
    customerId: order.customerId,
    vehicleId: order.vehicleId,
    history: order.history,
    serviceItems: order.serviceItems,
    partItems: order.partItems,
    quotes: order.quotes,
  });
}
