import { Injectable } from '@nestjs/common';
import type { ServiceOrderStatus } from '../domain/service-order-status.js';
import {
  type ServiceOrderFilter,
  ServiceOrderRepository,
} from '../domain/service-order.repository.js';
import {
  type ServiceOrderSummaryOutput,
  toServiceOrderSummary,
} from './service-order.output.js';

export interface ListServiceOrdersInput {
  status?: ServiceOrderStatus;
  customerId?: string;
  openedFrom?: string;
  openedTo?: string;
  page: number;
  pageSize: number;
}

export interface ListServiceOrdersOutput {
  items: ServiceOrderSummaryOutput[];
  total: number;
  page: number;
  pageSize: number;
}

export type OpenedPeriod = Pick<
  ServiceOrderFilter,
  'openedFrom' | 'openedBefore'
>;

const DAY_MS = 24 * 60 * 60 * 1000;

const startOfDayInBrasilia = (date: string) =>
  new Date(`${date}T00:00:00.000-03:00`);

export function toOpenedPeriod(from?: string, to?: string): OpenedPeriod {
  const openedFrom = from ? startOfDayInBrasilia(from) : undefined;
  const openedBefore = to
    ? new Date(startOfDayInBrasilia(to).getTime() + DAY_MS)
    : undefined;
  return { openedFrom, openedBefore };
}

@Injectable()
export class ListServiceOrdersUseCase {
  constructor(private readonly orders: ServiceOrderRepository) {}

  async execute({
    status,
    customerId,
    openedFrom,
    openedTo,
    page,
    pageSize,
  }: ListServiceOrdersInput): Promise<ListServiceOrdersOutput> {
    const { items, total } = await this.orders.list(
      { status, customerId, ...toOpenedPeriod(openedFrom, openedTo) },
      page,
      pageSize,
    );
    return { items: items.map(toServiceOrderSummary), total, page, pageSize };
  }
}
