import type { Money } from '../../../shared/domain/money.js';
import {
  InvalidServiceOrderError,
  QuoteAlreadyDecidedError,
} from './service-order.errors.js';

export type QuoteDecision = 'APPROVED' | 'REJECTED';

export interface QuoteProps {
  version: number;
  total: Money;
  generatedAt: Date;
  decision: QuoteDecision | null;
  decidedAt: Date | null;
  rejectionReason: string | null;
}

export function assertQuoteVersion(version: number): void {
  if (!Number.isInteger(version) || version < 1) {
    throw new InvalidServiceOrderError(
      'A versão do orçamento deve ser um inteiro a partir de 1',
    );
  }
}

export class Quote {
  private constructor(private readonly props: QuoteProps) {}

  static generate(version: number, total: Money, at: Date): Quote {
    assertQuoteVersion(version);
    return new Quote({
      version,
      total,
      generatedAt: at,
      decision: null,
      decidedAt: null,
      rejectionReason: null,
    });
  }

  static restore(props: QuoteProps): Quote {
    return new Quote(props);
  }

  approve(at: Date): Quote {
    this.assertPending();
    return new Quote({ ...this.props, decision: 'APPROVED', decidedAt: at });
  }

  reject(at: Date, reason?: string | null): Quote {
    this.assertPending();
    return new Quote({
      ...this.props,
      decision: 'REJECTED',
      decidedAt: at,
      rejectionReason: reason?.trim() || null,
    });
  }

  get version(): number {
    return this.props.version;
  }

  get total(): Money {
    return this.props.total;
  }

  get generatedAt(): Date {
    return this.props.generatedAt;
  }

  get decision(): QuoteDecision | null {
    return this.props.decision;
  }

  get decidedAt(): Date | null {
    return this.props.decidedAt;
  }

  get rejectionReason(): string | null {
    return this.props.rejectionReason;
  }

  get isPending(): boolean {
    return this.props.decision === null;
  }

  private assertPending(): void {
    if (!this.isPending) throw new QuoteAlreadyDecidedError();
  }
}
