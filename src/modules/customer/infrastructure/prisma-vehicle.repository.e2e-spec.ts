import { randomUUID } from 'node:crypto';
import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { validateEnv } from '../../../shared/infrastructure/config/env.validation.js';
import { PrismaModule } from '../../../shared/infrastructure/database/prisma.module.js';
import { PrismaTransactionHost } from '../../../shared/infrastructure/database/prisma-transaction-host.js';
import { Customer } from '../domain/customer.js';
import { CustomerNotFoundError } from '../domain/customer.errors.js';
import { Document } from '../domain/document.js';
import { LicensePlate } from '../domain/license-plate.js';
import { LicensePlateAlreadyRegisteredError } from '../domain/vehicle.errors.js';
import { Vehicle } from '../domain/vehicle.js';
import { generateCpf } from '../testing/document-generator.js';
import { generatePlate } from '../testing/plate-generator.js';
import { PrismaCustomerRepository } from './prisma-customer.repository.js';
import { PrismaVehicleRepository } from './prisma-vehicle.repository.js';

describe('PrismaVehicleRepository (integração)', () => {
  let moduleRef: TestingModule;
  let vehicles: PrismaVehicleRepository;
  let customers: PrismaCustomerRepository;
  let host: PrismaTransactionHost;
  const customerIds: string[] = [];
  const vehicleIds: string[] = [];

  async function newCustomer(): Promise<Customer> {
    const customer = Customer.create({
      name: 'Dono do Veículo',
      document: Document.create(generateCpf()),
    });
    await customers.save(customer);
    customerIds.push(customer.id);
    return customer;
  }

  async function newVehicle(
    customerId: string,
    plate = generatePlate(),
  ): Promise<Vehicle> {
    const vehicle = Vehicle.create(
      {
        customerId,
        plate: LicensePlate.create(plate),
        brand: 'Volkswagen',
        model: 'Gol',
        year: 2020,
      },
      new Date(),
    );
    await vehicles.save(vehicle);
    vehicleIds.push(vehicle.id);
    return vehicle;
  }

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
        PrismaModule,
      ],
      providers: [PrismaVehicleRepository, PrismaCustomerRepository],
    }).compile();
    await moduleRef.init();

    vehicles = moduleRef.get(PrismaVehicleRepository);
    customers = moduleRef.get(PrismaCustomerRepository);
    host = moduleRef.get(PrismaTransactionHost);
  });

  afterAll(async () => {
    await host?.client.vehicle.deleteMany({
      where: { id: { in: vehicleIds } },
    });
    await host?.client.customer.deleteMany({
      where: { id: { in: customerIds } },
    });
    await moduleRef?.close();
  });

  it('grava e lê o veículo de volta, por id e por placa', async () => {
    const owner = await newCustomer();
    const vehicle = await newVehicle(owner.id);

    const byId = await vehicles.findById(vehicle.id);
    const byPlate = await vehicles.findByPlate(vehicle.plate);

    expect(byId?.customerId).toBe(owner.id);
    expect(byId?.year).toBe(2020);
    expect(byId?.plate.equals(vehicle.plate)).toBe(true);
    expect(byPlate?.id).toBe(vehicle.id);
  });

  it('converte placa duplicada em LicensePlateAlreadyRegisteredError', async () => {
    const owner = await newCustomer();
    const plate = generatePlate();
    await newVehicle(owner.id, plate);

    await expect(newVehicle(owner.id, plate)).rejects.toThrow(
      LicensePlateAlreadyRegisteredError,
    );
  });

  it('converte cliente inexistente em CustomerNotFoundError', async () => {
    await expect(newVehicle(randomUUID())).rejects.toThrow(
      CustomerNotFoundError,
    );
  });

  it('esconde o veículo removido e libera a placa para outro cadastro', async () => {
    const owner = await newCustomer();
    const removed = await newVehicle(owner.id);
    removed.delete(new Date());
    await vehicles.save(removed);

    expect(await vehicles.findById(removed.id)).toBeNull();
    const recreated = await newVehicle(owner.id, removed.plate.value);
    expect((await vehicles.findByPlate(removed.plate))?.id).toBe(recreated.id);
  });

  it('filtra a listagem pelo cliente', async () => {
    const owner = await newCustomer();
    const other = await newCustomer();
    await newVehicle(owner.id);
    await newVehicle(owner.id);
    await newVehicle(other.id);

    const page = await vehicles.list({ customerId: owner.id }, 1, 10);

    expect(page.total).toBe(2);
    expect(page.items.every((v) => v.customerId === owner.id)).toBe(true);
  });

  it('responde se o cliente tem veículos ativos', async () => {
    const owner = await newCustomer();
    const withoutVehicles = await newCustomer();
    const vehicle = await newVehicle(owner.id);

    expect(await vehicles.existsForCustomer(owner.id)).toBe(true);
    expect(await vehicles.existsForCustomer(withoutVehicles.id)).toBe(false);

    vehicle.delete(new Date());
    await vehicles.save(vehicle);
    expect(await vehicles.existsForCustomer(owner.id)).toBe(false);
  });
});
