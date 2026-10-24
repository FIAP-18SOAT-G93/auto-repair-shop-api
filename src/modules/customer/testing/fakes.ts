import { ServiceOrderChecker } from '../application/service-order-checker.js';
import type { Customer } from '../domain/customer.js';
import {
  CustomerRepository,
  type CustomerPage,
} from '../domain/customer.repository.js';
import type { Document } from '../domain/document.js';

/** Guarda todos os clientes, inclusive os removidos, mas só devolve os ativos. */
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

/** Permite ao teste decidir quais clientes "têm OS aberta". */
export class FakeServiceOrderChecker implements ServiceOrderChecker {
  readonly customersWithOpenOrders = new Set<string>();

  async customerHasOpenServiceOrders(customerId: string): Promise<boolean> {
    return this.customersWithOpenOrders.has(customerId);
  }
}
