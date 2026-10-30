import type { QuoteDecision } from '../domain/quote.js';
import {
  STATUS_LABELS,
  type ServiceOrderStatus,
} from '../domain/service-order-status.js';
import type { ServiceOrder } from '../domain/service-order.js';

export interface ServiceOrderOutput {
  id: string;
  number: number;
  customerId: string;
  vehicleId: string;
  status: ServiceOrderStatus;
  statusLabel: string;
  openedAt: Date;
  services: { serviceId: string; name: string; price: number }[];
  parts: {
    partId: string;
    name: string;
    unitPrice: number;
    quantity: number;
    total: number;
  }[];
  quote: {
    version: number;
    total: number;
    generatedAt: Date;
    decision: QuoteDecision | null;
    decidedAt: Date | null;
    rejectionReason: string | null;
  } | null;
  history: {
    from: ServiceOrderStatus | null;
    to: ServiceOrderStatus;
    changedAt: Date;
  }[];
}

export interface ServiceOrderSummaryOutput {
  id: string;
  number: number;
  customerId: string;
  vehicleId: string;
  status: ServiceOrderStatus;
  statusLabel: string;
  openedAt: Date;
}

export function toServiceOrderSummary(
  order: ServiceOrder,
): ServiceOrderSummaryOutput {
  return {
    id: order.id,
    number: order.number,
    customerId: order.customerId,
    vehicleId: order.vehicleId,
    status: order.status,
    statusLabel: STATUS_LABELS[order.status],
    openedAt: order.openedAt,
  };
}

export function toServiceOrderOutput(order: ServiceOrder): ServiceOrderOutput {
  const quote = order.currentQuote;
  return {
    id: order.id,
    number: order.number,
    customerId: order.customerId,
    vehicleId: order.vehicleId,
    status: order.status,
    statusLabel: STATUS_LABELS[order.status],
    openedAt: order.openedAt,
    services: order.serviceItems.map((item) => ({
      serviceId: item.serviceId,
      name: item.name,
      price: item.price.toDecimal(),
    })),
    parts: order.partItems.map((item) => ({
      partId: item.partId,
      name: item.name,
      unitPrice: item.unitPrice.toDecimal(),
      quantity: item.quantity.value,
      total: item.total.toDecimal(),
    })),
    quote: quote && {
      version: quote.version,
      total: quote.total.toDecimal(),
      generatedAt: quote.generatedAt,
      decision: quote.decision,
      decidedAt: quote.decidedAt,
      rejectionReason: quote.rejectionReason,
    },
    history: order.history.entries.map((change) => ({
      from: change.from,
      to: change.to,
      changedAt: change.changedAt,
    })),
  };
}
