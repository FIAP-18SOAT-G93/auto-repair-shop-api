import { randomUUID } from 'node:crypto';
import { AggregateRoot } from '../../../shared/domain/aggregate-root.js';
import type { LicensePlate } from './license-plate.js';
import {
  InvalidVehicleError,
  VehicleAlreadyDeletedError,
} from './vehicle.errors.js';

export interface VehicleDetails {
  brand: string;
  model: string;
  year: number;
}

interface VehicleProps extends VehicleDetails {
  customerId: string;
  plate: LicensePlate;
  deletedAt: Date | null;
}

const MIN_YEAR = 1900;

export class Vehicle extends AggregateRoot {
  private constructor(
    id: string,
    private props: VehicleProps,
  ) {
    super(id);
  }

  static create(
    input: VehicleDetails & { customerId: string; plate: LicensePlate },
    now: Date,
  ): Vehicle {
    return new Vehicle(randomUUID(), {
      ...Vehicle.normalize(input, now),
      customerId: input.customerId,
      plate: input.plate,
      deletedAt: null,
    });
  }

  static restore(id: string, props: VehicleProps): Vehicle {
    return new Vehicle(id, props);
  }

  update(details: VehicleDetails, now: Date): void {
    this.props = { ...this.props, ...Vehicle.normalize(details, now) };
  }

  delete(now: Date): void {
    if (this.isDeleted) {
      throw new VehicleAlreadyDeletedError();
    }
    this.props.deletedAt = now;
  }

  get customerId(): string {
    return this.props.customerId;
  }

  get plate(): LicensePlate {
    return this.props.plate;
  }

  get brand(): string {
    return this.props.brand;
  }

  get model(): string {
    return this.props.model;
  }

  get year(): number {
    return this.props.year;
  }

  get deletedAt(): Date | null {
    return this.props.deletedAt;
  }

  get isDeleted(): boolean {
    return this.props.deletedAt !== null;
  }

  private static normalize(details: VehicleDetails, now: Date): VehicleDetails {
    const normalizedBrand = details.brand.trim();
    const normalizedModel = details.model.trim();
    const maxYear = now.getFullYear() + 1;

    if (normalizedBrand.length < 1) {
      throw new InvalidVehicleError('A marca não deve ser vazia.');
    }
    if (normalizedModel.length < 1) {
      throw new InvalidVehicleError('O modelo não deve ser vazio.');
    }
    if (
      !Number.isInteger(details.year) ||
      details.year < MIN_YEAR ||
      details.year > maxYear
    ) {
      throw new InvalidVehicleError(
        `O ano deve ser um número inteiro entre ${MIN_YEAR} e ${maxYear}.`,
      );
    }

    return {
      brand: normalizedBrand,
      model: normalizedModel,
      year: details.year,
    };
  }
}
