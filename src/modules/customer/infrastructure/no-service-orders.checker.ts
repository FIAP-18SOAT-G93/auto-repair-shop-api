import { Injectable } from '@nestjs/common';
import { ServiceOrderChecker } from '../application/service-order-checker.js';

/**
 * Implementação provisória, ainda não existe ordens de serviço no sistema.
 */
@Injectable()
export class NoServiceOrdersChecker implements ServiceOrderChecker {
  async customerHasOpenServiceOrders(): Promise<boolean> {
    return false;
  }
  async vehicleHasOpenServiceOrders(): Promise<boolean> {
    return false;
  }
}
