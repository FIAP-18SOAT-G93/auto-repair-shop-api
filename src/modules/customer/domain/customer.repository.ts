import type { Customer } from './customer.js';
import type { Document } from './document.js';

export interface CustomerPage {
  items: Customer[];
  total: number;
}

/**
 * Coleção dos clientes ativos. Os clientes removidos (soft delete) continuam
 * no banco para o histórico, mas nenhuma busca os devolve.
 */
export abstract class CustomerRepository {
  abstract save(customer: Customer): Promise<void>;
  abstract findById(id: string): Promise<Customer | null>;
  abstract findByDocument(document: Document): Promise<Customer | null>;
  abstract list(page: number, pageSize: number): Promise<CustomerPage>;
}
