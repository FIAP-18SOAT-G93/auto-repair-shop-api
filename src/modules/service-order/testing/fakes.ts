import { randomUUID } from 'node:crypto';
import type {
  NotificationGateway,
  QuoteAvailableNotification,
  ServiceOrderFinishedNotification,
} from '../../../shared/application/notification.gateway.js';
import type { UnitOfWork } from '../../../shared/application/unit-of-work.js';
import type { Money } from '../../../shared/domain/money.js';
import type { Quantity } from '../../../shared/domain/quantity.js';
import {
  PartNotFoundError,
  PartOutOfStockError,
} from '../../catalog/domain/part.errors.js';
import { ServiceNotFoundError } from '../../catalog/domain/service.errors.js';
import type {
  CustomerDirectory,
  CustomerRef,
  NewCustomer,
  NewVehicle,
  VehicleRef,
} from '../application/ports/customer-directory.js';
import type {
  DeductedPart,
  PartStock,
} from '../application/ports/part-stock.js';
import type {
  CatalogService,
  ServiceCatalog,
} from '../application/ports/service-catalog.js';
import { ServiceOrderStatus } from '../domain/service-order-status.js';
import { VehicleHasOpenServiceOrderError } from '../domain/service-order.errors.js';
import { ServiceOrder } from '../domain/service-order.js';
import type { TrackingCode } from '../domain/tracking-code.js';
import {
  type ServiceOrderFilter,
  type ServiceOrderPage,
  ServiceOrderRepository,
} from '../domain/service-order.repository.js';

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

  findByIdForUpdate(id: string): Promise<ServiceOrder | null> {
    return this.findById(id);
  }

  async findByTrackingCode(code: TrackingCode): Promise<ServiceOrder | null> {
    const order = [...this.orders.values()].find((o) =>
      o.trackingCode.equals(code),
    );
    return order ? copy(order) : null;
  }

  async findOpenByVehicle(vehicleId: string): Promise<ServiceOrder | null> {
    const order = this.open().find((o) => o.vehicleId === vehicleId);
    return order ? copy(order) : null;
  }

  async existsOpenForCustomer(customerId: string): Promise<boolean> {
    return this.open().some((o) => o.customerId === customerId);
  }

  async list(
    filter: ServiceOrderFilter,
    page: number,
    pageSize: number,
  ): Promise<ServiceOrderPage> {
    const matches = [...this.orders.values()]
      .filter(
        (o) =>
          (!filter.status || o.status === filter.status) &&
          (!filter.customerId || o.customerId === filter.customerId) &&
          (!filter.openedFrom || o.openedAt >= filter.openedFrom) &&
          (!filter.openedBefore || o.openedAt < filter.openedBefore),
      )
      .sort((a, b) => b.number - a.number);
    const start = (page - 1) * pageSize;
    return {
      items: matches.slice(start, start + pageSize).map(copy),
      total: matches.length,
    };
  }

  async listFinished(): Promise<ServiceOrder[]> {
    return [...this.orders.values()]
      .filter(
        (o) =>
          o.status === ServiceOrderStatus.FINISHED ||
          o.status === ServiceOrderStatus.DELIVERED,
      )
      .map(copy);
  }

  private open(): ServiceOrder[] {
    return [...this.orders.values()].filter((o) => o.isOpen);
  }
}

function copy(order: ServiceOrder): ServiceOrder {
  return ServiceOrder.restore(order.id, {
    number: order.number,
    trackingCode: order.trackingCode,
    customerId: order.customerId,
    vehicleId: order.vehicleId,
    history: order.history,
    serviceItems: order.serviceItems,
    partItems: order.partItems,
    quotes: order.quotes,
  });
}

export class ImmediateUnitOfWork implements UnitOfWork {
  run<T>(work: () => Promise<T>): Promise<T> {
    return work();
  }
}

const digits = (document: string) => document.replace(/\D/g, '');
const plateKey = (plate: string) => plate.replace(/[-\s]/g, '').toUpperCase();

export class FakeCustomerDirectory implements CustomerDirectory {
  readonly customers = new Map<string, CustomerRef>();
  readonly vehicles = new Map<string, VehicleRef>();

  async findCustomerByDocument(document: string): Promise<CustomerRef | null> {
    return this.customers.get(digits(document)) ?? null;
  }

  async registerCustomer(input: NewCustomer): Promise<CustomerRef> {
    const customer = { id: randomUUID() };
    this.customers.set(digits(input.document), customer);
    return customer;
  }

  async findVehicleByPlate(plate: string): Promise<VehicleRef | null> {
    return this.vehicles.get(plateKey(plate)) ?? null;
  }

  async registerVehicle(input: NewVehicle): Promise<VehicleRef> {
    const vehicle = { id: randomUUID(), customerId: input.customerId };
    this.vehicles.set(plateKey(input.plate), vehicle);
    return vehicle;
  }
}

export class FakeServiceCatalog implements ServiceCatalog {
  readonly services = new Map<string, CatalogService>();

  async getService(serviceId: string): Promise<CatalogService> {
    const service = this.services.get(serviceId);
    if (!service) throw new ServiceNotFoundError();
    return service;
  }
}

interface StockedPart {
  name: string;
  unitPrice: Money;
  quantity: Quantity;
}

export class FakePartStock implements PartStock {
  readonly parts = new Map<string, StockedPart>();

  async deduct(partId: string, quantity: Quantity): Promise<DeductedPart> {
    const part = this.parts.get(partId);
    if (!part) throw new PartNotFoundError();
    if (!part.quantity.isGreaterThanOrEqual(quantity)) {
      throw new PartOutOfStockError();
    }
    this.parts.set(partId, {
      ...part,
      quantity: part.quantity.subtract(quantity),
    });
    return { id: partId, name: part.name, unitPrice: part.unitPrice };
  }

  async reverse(partId: string, quantity: Quantity): Promise<void> {
    const part = this.parts.get(partId);
    if (!part) return;
    this.parts.set(partId, { ...part, quantity: part.quantity.add(quantity) });
  }
}

export class FakeNotificationGateway implements NotificationGateway {
  readonly quotesAvailable: QuoteAvailableNotification[] = [];
  readonly ordersFinished: ServiceOrderFinishedNotification[] = [];

  async quoteAvailable(notification: QuoteAvailableNotification) {
    this.quotesAvailable.push(notification);
  }

  async serviceOrderFinished(notification: ServiceOrderFinishedNotification) {
    this.ordersFinished.push(notification);
  }
}
