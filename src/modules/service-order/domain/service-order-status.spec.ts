import {
  assertCanTransition,
  canTransition,
  isOpenStatus,
  ServiceOrderStatus,
} from './service-order-status.js';
import { InvalidStatusTransitionError } from './service-order.errors.js';

const ALL = Object.values(ServiceOrderStatus);

const VALID: ReadonlyArray<[ServiceOrderStatus, ServiceOrderStatus]> = [
  ['RECEIVED', 'IN_DIAGNOSIS'],
  ['IN_DIAGNOSIS', 'AWAITING_APPROVAL'],
  ['AWAITING_APPROVAL', 'IN_EXECUTION'],
  ['AWAITING_APPROVAL', 'FINISHED'],
  ['IN_EXECUTION', 'FINISHED'],
  ['IN_EXECUTION', 'AWAITING_APPROVAL'],
  ['FINISHED', 'DELIVERED'],
];

const isValid = (from: ServiceOrderStatus, to: ServiceOrderStatus) =>
  VALID.some(([f, t]) => f === from && t === to);

const INVALID = ALL.flatMap((from) =>
  ALL.filter((to) => !isValid(from, to)).map(
    (to) => [from, to] as [ServiceOrderStatus, ServiceOrderStatus],
  ),
);

describe('ServiceOrderStatus', () => {
  it('cobre as 36 combinações de status', () => {
    expect(VALID.length + INVALID.length).toBe(36);
  });

  it.each(VALID)('permite %s → %s', (from, to) => {
    expect(canTransition(from, to)).toBe(true);
    expect(() => assertCanTransition(from, to)).not.toThrow();
  });

  it.each(INVALID)('recusa %s → %s', (from, to) => {
    expect(canTransition(from, to)).toBe(false);
    expect(() => assertCanTransition(from, to)).toThrow(
      InvalidStatusTransitionError,
    );
  });

  it('explica a transição recusada com os nomes em português', () => {
    expect(() => assertCanTransition('RECEIVED', 'FINISHED')).toThrow(
      'A OS não pode passar de "Recebida" para "Finalizada"',
    );
  });

  it('considera aberta toda OS que ainda não foi entregue', () => {
    const open = ALL.filter(isOpenStatus);

    expect(open).toHaveLength(5);
    expect(isOpenStatus('FINISHED')).toBe(true);
    expect(isOpenStatus('DELIVERED')).toBe(false);
  });
});
