/** Responde se um cliente ou veículo possui ordens de serviço abertas. */
export abstract class ServiceOrderChecker {
  abstract customerHasOpenServiceOrders(customerId: string): Promise<boolean>;
  abstract vehicleHasOpenServiceOrders(vehicleId: string): Promise<boolean>;
}
