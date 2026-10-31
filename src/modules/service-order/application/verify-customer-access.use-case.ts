import { Injectable } from '@nestjs/common';
import { ServiceOrderRepository } from '../domain/service-order.repository.js';
import { TrackingCode } from '../domain/tracking-code.js';
import { CustomerDirectory } from './ports/customer-directory.js';

export interface VerifyCustomerAccessInput {
  document: string;
  trackingCode: string;
}

@Injectable()
export class VerifyCustomerAccessUseCase {
  constructor(
    private readonly orders: ServiceOrderRepository,
    private readonly directory: CustomerDirectory,
  ) {}

  async execute({
    document,
    trackingCode,
  }: VerifyCustomerAccessInput): Promise<string | null> {
    const order = await this.orders.findByTrackingCode(
      TrackingCode.parse(trackingCode),
    );
    if (!order) return null;

    const customer = await this.directory.findCustomerByDocument(document);
    return customer?.id === order.customerId ? customer.id : null;
  }
}
