import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaTransactionHost } from '../../../shared/infrastructure/database/prisma-transaction-host.js';
import { CustomerNotFoundError } from '../domain/customer.errors.js';
import { LicensePlate } from '../domain/license-plate.js';
import { LicensePlateAlreadyRegisteredError } from '../domain/vehicle.errors.js';
import { Vehicle } from '../domain/vehicle.js';
import {
  type VehicleFilter,
  type VehiclePage,
  VehicleRepository,
} from '../domain/vehicle.repository.js';

type VehicleRecord = Prisma.VehicleGetPayload<object>;

/** Filtro aplicado em todas as buscas: os veículos removidos nunca são devolvidos. */
const ACTIVE = { deletedAt: null } satisfies Prisma.VehicleWhereInput;

@Injectable()
export class PrismaVehicleRepository implements VehicleRepository {
  constructor(private readonly host: PrismaTransactionHost) {}

  async save(vehicle: Vehicle): Promise<void> {
    const data = {
      customerId: vehicle.customerId,
      plate: vehicle.plate.value,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      deletedAt: vehicle.deletedAt,
    };
    try {
      await this.host.client.vehicle.upsert({
        where: { id: vehicle.id },
        create: { id: vehicle.id, ...data },
        update: data,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2002':
            throw new LicensePlateAlreadyRegisteredError();
          case 'P2003':
            throw new CustomerNotFoundError();
        }
      }
      throw error;
    }
  }

  async findById(id: string): Promise<Vehicle | null> {
    const record = await this.host.client.vehicle.findFirst({
      where: { id, ...ACTIVE },
    });
    return record ? toDomain(record) : null;
  }

  async findByPlate(plate: LicensePlate): Promise<Vehicle | null> {
    const record = await this.host.client.vehicle.findFirst({
      where: { plate: plate.value, ...ACTIVE },
    });
    return record ? toDomain(record) : null;
  }

  async list(
    filter: VehicleFilter,
    page: number,
    pageSize: number,
  ): Promise<VehiclePage> {
    const where = { ...ACTIVE, customerId: filter.customerId };
    const [records, total] = await Promise.all([
      this.host.client.vehicle.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.host.client.vehicle.count({ where }),
    ]);
    return { items: records.map(toDomain), total };
  }

  async existsForCustomer(customerId: string): Promise<boolean> {
    const record = await this.host.client.vehicle.findFirst({
      where: { customerId, ...ACTIVE },
      select: { id: true },
    });
    return record !== null;
  }
}

function toDomain(record: VehicleRecord): Vehicle {
  return Vehicle.restore(record.id, {
    customerId: record.customerId,
    plate: LicensePlate.create(record.plate),
    brand: record.brand,
    model: record.model,
    year: record.year,
    deletedAt: record.deletedAt,
  });
}
