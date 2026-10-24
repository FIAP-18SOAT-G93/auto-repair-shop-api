import { Injectable } from '@nestjs/common';
import { ServiceOrderChecker } from '../application/service-order-checker.js';

/**
 * Implementação provisória: ainda não existem ordens de serviço no sistema.
 * Será substituída pela implementação do módulo de OS (PR 11).
 */
@Injectable()
export class NoServiceOrdersChecker implements ServiceOrderChecker {
  async customerHasOpenServiceOrders(): Promise<boolean> {
    return false;
  }
}
