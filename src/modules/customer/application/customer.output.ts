import type { DocumentType } from '../domain/document.js';
import type { Customer } from '../domain/customer.js';

export interface CustomerOutput {
  id: string;
  name: string;
  document: string;
  documentType: DocumentType;
  email: string | null;
  phone: string | null;
}

export function toCustomerOutput(customer: Customer): CustomerOutput {
  return {
    id: customer.id,
    name: customer.name,
    document: customer.document.format(),
    documentType: customer.document.type,
    email: customer.email,
    phone: customer.phone,
  };
}
