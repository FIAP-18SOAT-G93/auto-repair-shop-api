import { randomUUID } from 'node:crypto';
import { AggregateRoot } from '../../../shared/domain/aggregate-root.js';
import {
  CustomerAlreadyDeletedError,
  InvalidCustomerError,
} from './customer.errors.js';
import type { Document } from './document.js';

export interface CustomerDetails {
  name: string;
  email?: string | null;
  phone?: string | null;
}

interface CustomerProps {
  name: string;
  document: Document;
  email: string | null;
  phone: string | null;
  deletedAt: Date | null;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\d{10,11}$/;

export class Customer extends AggregateRoot {
  private constructor(
    id: string,
    private props: CustomerProps,
  ) {
    super(id);
  }

  static create(input: CustomerDetails & { document: Document }): Customer {
    return new Customer(randomUUID(), {
      ...Customer.normalize(input),
      document: input.document,
      deletedAt: null,
    });
  }

  static restore(id: string, props: CustomerProps): Customer {
    return new Customer(id, props);
  }

  update(details: CustomerDetails): void {
    this.props = { ...this.props, ...Customer.normalize(details) };
  }

  /** Soft delete: o registro continua no banco para preservar o histórico das OS. */
  delete(now: Date): void {
    if (this.isDeleted) {
      throw new CustomerAlreadyDeletedError();
    }
    this.props.deletedAt = now;
  }

  get name(): string {
    return this.props.name;
  }

  get document(): Document {
    return this.props.document;
  }

  get email(): string | null {
    return this.props.email;
  }

  get phone(): string | null {
    return this.props.phone;
  }

  get deletedAt(): Date | null {
    return this.props.deletedAt;
  }

  get isDeleted(): boolean {
    return this.props.deletedAt !== null;
  }

  private static normalize(details: CustomerDetails): {
    name: string;
    email: string | null;
    phone: string | null;
  } {
    const normalizedName = details.name.trim();
    const normalizedEmail = details.email?.trim().toLowerCase() || null;
    const normalizedPhone = details.phone?.replace(/\D/g, '') || null;

    if (normalizedName.length < 1) {
      throw new InvalidCustomerError('O nome não deve ser vazio.');
    }
    if (normalizedEmail && !EMAIL_PATTERN.test(normalizedEmail)) {
      throw new InvalidCustomerError(`E-mail inválido: ${details.email}`);
    }
    if (normalizedPhone && !PHONE_PATTERN.test(normalizedPhone)) {
      throw new InvalidCustomerError(
        'Telefone deve ter 10 ou 11 dígitos, com DDD',
      );
    }

    return {
      name: normalizedName,
      email: normalizedEmail,
      phone: normalizedPhone,
    };
  }
}
