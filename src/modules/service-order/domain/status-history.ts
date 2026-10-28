import {
  assertCanTransition,
  ServiceOrderStatus,
} from './service-order-status.js';
import { InvalidServiceOrderError } from './service-order.errors.js';

export interface StatusChange {
  readonly from: ServiceOrderStatus | null;
  readonly to: ServiceOrderStatus;
  readonly changedAt: Date;
}

export class StatusHistory {
  private constructor(private readonly changes: readonly StatusChange[]) {}

  static start(at: Date): StatusHistory {
    return new StatusHistory([
      { from: null, to: ServiceOrderStatus.RECEIVED, changedAt: at },
    ]);
  }

  static restore(changes: readonly StatusChange[]): StatusHistory {
    if (changes.length === 0) {
      throw new InvalidServiceOrderError(
        'O histórico de status não pode ser vazio',
      );
    }
    return new StatusHistory(changes);
  }

  record(to: ServiceOrderStatus, at: Date): StatusHistory {
    const last = this.last;
    assertCanTransition(last.to, to);
    if (at < last.changedAt) {
      throw new InvalidServiceOrderError(
        'A mudança de status não pode ser anterior à última registrada',
      );
    }
    return new StatusHistory([
      ...this.changes,
      { from: last.to, to, changedAt: at },
    ]);
  }

  get current(): ServiceOrderStatus {
    return this.last.to;
  }

  get entries(): readonly StatusChange[] {
    return this.changes;
  }

  executionTimeMs(): number | null {
    let total = 0;
    let startedAt: Date | null = null;
    let executed = false;

    for (const change of this.changes) {
      if (startedAt && change.from === ServiceOrderStatus.IN_EXECUTION) {
        total += change.changedAt.getTime() - startedAt.getTime();
        startedAt = null;
      }
      if (change.to === ServiceOrderStatus.IN_EXECUTION) {
        startedAt = change.changedAt;
        executed = true;
      }
    }

    return executed && !startedAt ? total : null;
  }

  private get last(): StatusChange {
    return this.changes[this.changes.length - 1];
  }
}
