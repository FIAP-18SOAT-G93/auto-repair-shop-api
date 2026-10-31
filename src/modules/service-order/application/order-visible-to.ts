import { ServiceOrderNotFoundError } from '../domain/service-order.errors.js';
import type { ServiceOrder } from '../domain/service-order.js';

export function orderVisibleTo(
  order: ServiceOrder | null,
  ownerId?: string,
): ServiceOrder {
  const hiddenFromOwner =
    ownerId !== undefined && order?.customerId !== ownerId;
  if (!order || hiddenFromOwner) throw new ServiceOrderNotFoundError();
  return order;
}
