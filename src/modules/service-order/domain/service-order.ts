import { randomUUID } from 'node:crypto';
import { AggregateRoot } from '../../../shared/domain/aggregate-root.js';
import { Money } from '../../../shared/domain/money.js';
import { PartItem, type PartItemProps } from './part-item.js';
import { QuoteCalculator } from './quote-calculator.js';
import { Quote } from './quote.js';
import { ServiceItem, type ServiceItemProps } from './service-item.js';
import {
  isOpenStatus,
  STATUS_LABELS,
  ServiceOrderStatus,
} from './service-order-status.js';
import {
  InvalidServiceOrderError,
  QuoteVersionMismatchError,
  ServiceOrderActionNotAllowedError,
  ServiceOrderWithoutItemsError,
} from './service-order.errors.js';
import {
  QuoteApproved,
  QuoteGenerated,
  QuoteRejected,
  ServiceOrderDelivered,
  ServiceOrderFinished,
  ServiceOrderOpened,
} from './service-order.events.js';
import { StatusHistory } from './status-history.js';
import type { TrackingCode } from './tracking-code.js';

export type NewServiceItem = Omit<ServiceItemProps, 'quoteVersion'>;
export type NewPartItem = Omit<PartItemProps, 'quoteVersion'>;

export interface AdditionalRepairItems {
  services?: readonly NewServiceItem[];
  parts?: readonly NewPartItem[];
}

export interface ServiceOrderProps {
  number: number;
  trackingCode: TrackingCode;
  customerId: string;
  vehicleId: string;
  history: StatusHistory;
  serviceItems: readonly ServiceItem[];
  partItems: readonly PartItem[];
  quotes: readonly Quote[];
}

export class ServiceOrder extends AggregateRoot {
  private constructor(
    id: string,
    private props: ServiceOrderProps,
  ) {
    super(id);
  }

  static open(
    input: {
      number: number;
      trackingCode: TrackingCode;
      customerId: string;
      vehicleId: string;
    },
    now: Date,
  ): ServiceOrder {
    if (!Number.isInteger(input.number) || input.number < 1) {
      throw new InvalidServiceOrderError(
        'O número da OS deve ser um inteiro a partir de 1',
      );
    }
    const order = new ServiceOrder(randomUUID(), {
      number: input.number,
      trackingCode: input.trackingCode,
      customerId: input.customerId,
      vehicleId: input.vehicleId,
      history: StatusHistory.start(now),
      serviceItems: [],
      partItems: [],
      quotes: [],
    });
    order.addDomainEvent(
      new ServiceOrderOpened(
        order.id,
        input.number,
        input.customerId,
        input.vehicleId,
        now,
      ),
    );
    return order;
  }

  static restore(id: string, props: ServiceOrderProps): ServiceOrder {
    return new ServiceOrder(id, props);
  }

  startDiagnosis(now: Date): void {
    this.assertStatus(ServiceOrderStatus.RECEIVED, 'iniciar o diagnóstico');
    this.moveTo(ServiceOrderStatus.IN_DIAGNOSIS, now);
  }

  assertAcceptsItems(): void {
    this.assertStatus(ServiceOrderStatus.IN_DIAGNOSIS, 'incluir itens');
  }

  addService(item: NewServiceItem): void {
    this.assertStatus(ServiceOrderStatus.IN_DIAGNOSIS, 'incluir serviços');
    this.pushServices([item]);
  }

  addPart(item: NewPartItem): void {
    this.assertStatus(ServiceOrderStatus.IN_DIAGNOSIS, 'incluir peças');
    this.pushParts([item]);
  }

  concludeDiagnosis(now: Date): void {
    this.assertStatus(
      ServiceOrderStatus.IN_DIAGNOSIS,
      'concluir o diagnóstico',
    );
    this.generateQuote(now);
  }

  approve(version: number, now: Date): void {
    const quote = this.pendingQuoteFor(version, 'aprovar o orçamento');
    this.replaceLatestQuote(quote.approve(now));
    this.moveTo(ServiceOrderStatus.IN_EXECUTION, now);
    this.addDomainEvent(new QuoteApproved(this.id, quote.version, now));
  }

  reject(version: number, now: Date, reason?: string | null): void {
    const quote = this.pendingQuoteFor(version, 'rejeitar o orçamento');
    const rejected = quote.reject(now, reason);
    this.replaceLatestQuote(rejected);
    const isAdditionalRepair = quote.version > 1;
    this.moveTo(
      isAdditionalRepair
        ? ServiceOrderStatus.IN_EXECUTION
        : ServiceOrderStatus.FINISHED,
      now,
    );

    const partsToReverse = this.partItems
      .filter((item) => item.quoteVersion === quote.version)
      .map((item) => ({ partId: item.partId, quantity: item.quantity }));
    this.addDomainEvent(
      new QuoteRejected(
        this.id,
        quote.version,
        rejected.rejectionReason,
        partsToReverse,
        now,
      ),
    );
  }

  assertAcceptsAdditionalRepair(): void {
    this.assertStatus(
      ServiceOrderStatus.IN_EXECUTION,
      'registrar reparo adicional',
    );
  }

  registerAdditionalRepair(items: AdditionalRepairItems, now: Date): void {
    this.assertAcceptsAdditionalRepair();
    const services = items.services ?? [];
    const parts = items.parts ?? [];
    if (services.length === 0 && parts.length === 0) {
      throw new InvalidServiceOrderError(
        'O reparo adicional precisa de ao menos um serviço ou peça',
      );
    }
    this.pushServices(services);
    this.pushParts(parts);
    this.generateQuote(now);
  }

  finish(now: Date): void {
    this.assertStatus(ServiceOrderStatus.IN_EXECUTION, 'finalizar a OS');
    this.moveTo(ServiceOrderStatus.FINISHED, now);
    this.addDomainEvent(new ServiceOrderFinished(this.id, now));
  }

  deliver(now: Date): void {
    this.assertStatus(ServiceOrderStatus.FINISHED, 'entregar o veículo');
    this.moveTo(ServiceOrderStatus.DELIVERED, now);
    this.addDomainEvent(new ServiceOrderDelivered(this.id, now));
  }

  getExecutionTime(): number | null {
    return this.props.history.executionTimeMs();
  }

  get number(): number {
    return this.props.number;
  }

  get trackingCode(): TrackingCode {
    return this.props.trackingCode;
  }

  get customerId(): string {
    return this.props.customerId;
  }

  get vehicleId(): string {
    return this.props.vehicleId;
  }

  get status(): ServiceOrderStatus {
    return this.props.history.current;
  }

  get isOpen(): boolean {
    return isOpenStatus(this.status);
  }

  get openedAt(): Date {
    return this.props.history.entries[0].changedAt;
  }

  get history(): StatusHistory {
    return this.props.history;
  }

  get serviceItems(): readonly ServiceItem[] {
    return this.props.serviceItems;
  }

  get partItems(): readonly PartItem[] {
    return this.props.partItems;
  }

  get quotes(): readonly Quote[] {
    return this.props.quotes;
  }

  get approvedServiceItems(): readonly ServiceItem[] {
    const approvedVersions = new Set(
      this.props.quotes
        .filter((quote) => quote.decision === 'APPROVED')
        .map((quote) => quote.version),
    );
    return this.props.serviceItems.filter((item) =>
      approvedVersions.has(item.quoteVersion),
    );
  }

  get currentQuote(): Quote | null {
    return this.props.quotes.at(-1) ?? null;
  }

  get approvedTotal(): Money {
    return this.props.quotes
      .filter((quote) => quote.decision === 'APPROVED')
      .reduce((sum, quote) => sum.add(quote.total), Money.zero());
  }

  get totalIfApproved(): Money {
    const pending = this.currentQuote?.isPending
      ? this.currentQuote.total
      : Money.zero();
    return this.approvedTotal.add(pending);
  }

  private get nextQuoteVersion(): number {
    return this.props.quotes.length + 1;
  }

  private generateQuote(now: Date): void {
    const version = this.nextQuoteVersion;
    const items = [...this.serviceItems, ...this.partItems].filter(
      (item) => item.quoteVersion === version,
    );
    if (items.length === 0) throw new ServiceOrderWithoutItemsError();

    const quote = Quote.generate(
      version,
      QuoteCalculator.calculate(items),
      now,
    );
    this.props = { ...this.props, quotes: [...this.props.quotes, quote] };
    this.moveTo(ServiceOrderStatus.AWAITING_APPROVAL, now);
    this.addDomainEvent(new QuoteGenerated(this.id, version, quote.total, now));
  }

  private pushServices(items: readonly NewServiceItem[]): void {
    const quoteVersion = this.nextQuoteVersion;
    this.props = {
      ...this.props,
      serviceItems: [
        ...this.props.serviceItems,
        ...items.map((item) => ServiceItem.create({ ...item, quoteVersion })),
      ],
    };
  }

  private pushParts(items: readonly NewPartItem[]): void {
    const quoteVersion = this.nextQuoteVersion;
    this.props = {
      ...this.props,
      partItems: [
        ...this.props.partItems,
        ...items.map((item) => PartItem.create({ ...item, quoteVersion })),
      ],
    };
  }

  private pendingQuoteFor(version: number, action: string): Quote {
    this.assertStatus(ServiceOrderStatus.AWAITING_APPROVAL, action);
    const quote = this.currentQuote as Quote;
    if (quote.version !== version) {
      throw new QuoteVersionMismatchError(quote.version);
    }
    return quote;
  }

  private replaceLatestQuote(quote: Quote): void {
    this.props = {
      ...this.props,
      quotes: [...this.props.quotes.slice(0, -1), quote],
    };
  }

  private moveTo(status: ServiceOrderStatus, now: Date): void {
    this.props = {
      ...this.props,
      history: this.props.history.record(status, now),
    };
  }

  private assertStatus(expected: ServiceOrderStatus, action: string): void {
    if (this.status !== expected) {
      throw new ServiceOrderActionNotAllowedError(
        action,
        STATUS_LABELS[this.status],
      );
    }
  }
}
