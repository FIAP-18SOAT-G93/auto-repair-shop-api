/** Responde se um cliente possui ordens de serviço abertas */
export abstract class ServiceOrderChecker {
  abstract customerHasOpenServiceOrders(customerId: string): Promise<boolean>;
}
