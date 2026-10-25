import { ServiceOrderChecker } from '../application/service-order-checker.js';
import type { Customer } from '../domain/customer.js';
import {
  CustomerRepository,
  type CustomerPage,
} from '../domain/customer.repository.js';
import type { Document } from '../domain/document.js';
import type { LicensePlate } from '../domain/license-plate.js';
import type { Vehicle } from '../domain/vehicle.js';
import {
  type VehicleFilter,
  type VehiclePage,
  VehicleRepository,
} from '../domain/vehicle.repository.js';

export class InMemoryCustomerRepository implements CustomerRepository {
  readonly customers = new Map<string, Customer>();

  async save(customer: Customer): Promise<void> {
    this.customers.set(customer.id, customer);
  }

  async findById(id: string): Promise<Customer | null> {
    const customer = this.customers.get(id);
    return customer && !customer.isDeleted ? customer : null;
  }

  async findByDocument(document: Document): Promise<Customer | null> {
    return this.active().find((c) => c.document.equals(document)) ?? null;
  }

  async list(page: number, pageSize: number): Promise<CustomerPage> {
    const active = this.active();
    const start = (page - 1) * pageSize;
    return {
      items: active.slice(start, start + pageSize),
      total: active.length,
    };
  }

  private active(): Customer[] {
    return [...this.customers.values()].filter((c) => !c.isDeleted);
  }
}

export class InMemoryVehicleRepository implements VehicleRepository {
  readonly vehicles = new Map<string, Vehicle>();

  async save(vehicle: Vehicle): Promise<void> {
    this.vehicles.set(vehicle.id, vehicle);
  }

  async findById(id: string): Promise<Vehicle | null> {
    const vehicle = this.vehicles.get(id);
    return vehicle && !vehicle.isDeleted ? vehicle : null;
  }

  async findByPlate(plate: LicensePlate): Promise<Vehicle | null> {
    return this.active().find((v) => v.plate.equals(plate)) ?? null;
  }

  async list(
    filter: VehicleFilter,
    page: number,
    pageSize: number,
  ): Promise<VehiclePage> {
    const matching = this.active().filter(
      (v) => !filter.customerId || v.customerId === filter.customerId,
    );
    const start = (page - 1) * pageSize;
    return {
      items: matching.slice(start, start + pageSize),
      total: matching.length,
    };
  }

  async existsForCustomer(customerId: string): Promise<boolean> {
    return this.active().some((v) => v.customerId === customerId);
  }

  private active(): Vehicle[] {
    return [...this.vehicles.values()].filter((v) => !v.isDeleted);
  }
}

export class FakeServiceOrderChecker implements ServiceOrderChecker {
  readonly customersWithOpenOrders = new Set<string>();
  readonly vehiclesWithOpenOrders = new Set<string>();

  async customerHasOpenServiceOrders(customerId: string): Promise<boolean> {
    return this.customersWithOpenOrders.has(customerId);
  }
  async vehicleHasOpenServiceOrders(vehicleId: string): Promise<boolean> {
    return this.vehiclesWithOpenOrders.has(vehicleId);
  }
}
