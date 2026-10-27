import { randomUUID } from 'node:crypto';
import { AggregateRoot } from '../../../shared/domain/aggregate-root.js';
import type { Money } from '../../../shared/domain/money.js';
import { InvalidServiceError } from './service.errors.js';

export interface ServiceDetails {
  name: string;
  description?: string | null;
  price: Money;
  estimatedMinutes: number;
}

interface ServiceProps {
  name: string;
  description: string | null;
  price: Money;
  estimatedMinutes: number;
}

const NAME_MAX_LENGTH = 100;

export class Service extends AggregateRoot {
  private constructor(
    id: string,
    private props: ServiceProps,
  ) {
    super(id);
  }

  static create(details: ServiceDetails): Service {
    return new Service(randomUUID(), Service.normalize(details));
  }

  static restore(id: string, props: ServiceProps): Service {
    return new Service(id, props);
  }

  update(details: ServiceDetails): void {
    this.props = Service.normalize(details);
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | null {
    return this.props.description;
  }

  get price(): Money {
    return this.props.price;
  }

  get estimatedMinutes(): number {
    return this.props.estimatedMinutes;
  }

  private static normalize(details: ServiceDetails): ServiceProps {
    const normalizedName = details.name.trim();
    const normalizedDescription = details.description?.trim() || null;

    if (normalizedName.length < 1) {
      throw new InvalidServiceError('O nome não deve ser vazio.');
    }
    if (normalizedName.length > NAME_MAX_LENGTH) {
      throw new InvalidServiceError(
        `O nome deve ter no máximo ${NAME_MAX_LENGTH} caracteres.`,
      );
    }
    if (
      !Number.isInteger(details.estimatedMinutes) ||
      details.estimatedMinutes <= 0
    ) {
      throw new InvalidServiceError(
        'O tempo estimado deve ser inteiro e maior que zero.',
      );
    }

    return {
      name: normalizedName,
      description: normalizedDescription,
      price: details.price,
      estimatedMinutes: details.estimatedMinutes,
    };
  }
}
