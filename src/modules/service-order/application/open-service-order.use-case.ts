import { Injectable } from '@nestjs/common';
import { UnitOfWork } from '../../../shared/application/unit-of-work.js';
import {
  InvalidServiceOrderError,
  VehicleHasOpenServiceOrderError,
  VehicleOwnedByAnotherCustomerError,
} from '../domain/service-order.errors.js';
import { ServiceOrder } from '../domain/service-order.js';
import { ServiceOrderRepository } from '../domain/service-order.repository.js';
import { TrackingCode } from '../domain/tracking-code.js';
import {
  CustomerDirectory,
  type CustomerRef,
  type VehicleRef,
} from './ports/customer-directory.js';
import {
  type ServiceOrderOutput,
  toServiceOrderOutput,
} from './service-order.output.js';

export interface OpenServiceOrderInput {
  customer: {
    document: string;
    name?: string;
    email?: string | null;
    phone?: string | null;
  };
  vehicle: {
    plate: string;
    brand?: string;
    model?: string;
    year?: number;
  };
}

@Injectable()
export class OpenServiceOrderUseCase {
  constructor(
    private readonly orders: ServiceOrderRepository,
    private readonly directory: CustomerDirectory,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  execute(input: OpenServiceOrderInput): Promise<ServiceOrderOutput> {
    return this.unitOfWork.run(async () => {
      const customer = await this.findOrRegisterCustomer(input.customer);
      const vehicle = await this.findOrRegisterVehicle(
        customer.id,
        input.vehicle,
      );
      if (vehicle.customerId !== customer.id) {
        throw new VehicleOwnedByAnotherCustomerError();
      }
      if (await this.orders.findOpenByVehicle(vehicle.id)) {
        throw new VehicleHasOpenServiceOrderError();
      }

      const order = ServiceOrder.open(
        {
          number: await this.orders.nextNumber(),
          trackingCode: await this.unusedTrackingCode(),
          customerId: customer.id,
          vehicleId: vehicle.id,
        },
        new Date(),
      );
      await this.orders.save(order);
      return toServiceOrderOutput(order);
    });
  }

  private async unusedTrackingCode(): Promise<TrackingCode> {
    let code = TrackingCode.generate();
    while (await this.orders.findByTrackingCode(code)) {
      code = TrackingCode.generate();
    }
    return code;
  }

  private async findOrRegisterCustomer(
    data: OpenServiceOrderInput['customer'],
  ): Promise<CustomerRef> {
    const existing = await this.directory.findCustomerByDocument(data.document);
    if (existing) return existing;
    if (!data.name) {
      throw new InvalidServiceOrderError(
        'Cliente não cadastrado: informe o nome para cadastrá-lo',
      );
    }
    return this.directory.registerCustomer({ ...data, name: data.name });
  }

  private async findOrRegisterVehicle(
    customerId: string,
    data: OpenServiceOrderInput['vehicle'],
  ): Promise<VehicleRef> {
    const existing = await this.directory.findVehicleByPlate(data.plate);
    if (existing) return existing;
    const { brand, model, year } = data;
    if (!brand || !model || year === undefined) {
      throw new InvalidServiceOrderError(
        'Veículo não cadastrado: informe marca, modelo e ano para cadastrá-lo',
      );
    }
    return this.directory.registerVehicle({
      customerId,
      plate: data.plate,
      brand,
      model,
      year,
    });
  }
}
