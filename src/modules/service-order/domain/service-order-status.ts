import { InvalidStatusTransitionError } from './service-order.errors.js';

export const ServiceOrderStatus = {
  RECEIVED: 'RECEIVED',
  IN_DIAGNOSIS: 'IN_DIAGNOSIS',
  AWAITING_APPROVAL: 'AWAITING_APPROVAL',
  IN_EXECUTION: 'IN_EXECUTION',
  FINISHED: 'FINISHED',
  DELIVERED: 'DELIVERED',
} as const;

export type ServiceOrderStatus =
  (typeof ServiceOrderStatus)[keyof typeof ServiceOrderStatus];

export const STATUS_LABELS: Record<ServiceOrderStatus, string> = {
  RECEIVED: 'Recebida',
  IN_DIAGNOSIS: 'Em diagnóstico',
  AWAITING_APPROVAL: 'Aguardando aprovação',
  IN_EXECUTION: 'Em execução',
  FINISHED: 'Finalizada',
  DELIVERED: 'Entregue',
};

const ALLOWED_TRANSITIONS: Record<
  ServiceOrderStatus,
  readonly ServiceOrderStatus[]
> = {
  RECEIVED: ['IN_DIAGNOSIS'],
  IN_DIAGNOSIS: ['AWAITING_APPROVAL'],
  AWAITING_APPROVAL: ['IN_EXECUTION', 'FINISHED'],
  IN_EXECUTION: ['FINISHED', 'AWAITING_APPROVAL'],
  FINISHED: ['DELIVERED'],
  DELIVERED: [],
};

export function canTransition(
  from: ServiceOrderStatus,
  to: ServiceOrderStatus,
): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function assertCanTransition(
  from: ServiceOrderStatus,
  to: ServiceOrderStatus,
): void {
  if (!canTransition(from, to)) {
    throw new InvalidStatusTransitionError(
      STATUS_LABELS[from],
      STATUS_LABELS[to],
    );
  }
}

export function isOpenStatus(status: ServiceOrderStatus): boolean {
  return status !== ServiceOrderStatus.DELIVERED;
}
