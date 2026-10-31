import type { ServiceOrderStatus } from './service-order-status.js';
import {
  InvalidServiceOrderError,
  InvalidStatusTransitionError,
} from './service-order.errors.js';
import { StatusHistory } from './status-history.js';

const at = (time: string) => new Date(`2026-10-27T${time}:00Z`);
const HOUR = 60 * 60 * 1000;

function historyOf(...steps: [ServiceOrderStatus, string][]): StatusHistory {
  return steps.reduce(
    (history, [status, time]) => history.record(status, at(time)),
    StatusHistory.start(at('08:00')),
  );
}

describe('StatusHistory', () => {
  it('começa com a OS recebida', () => {
    const history = StatusHistory.start(at('08:00'));

    expect(history.current).toBe('RECEIVED');
    expect(history.entries).toEqual([
      { from: null, to: 'RECEIVED', changedAt: at('08:00') },
    ]);
  });

  it('registra cada mudança com o status anterior e a data', () => {
    const history = historyOf(['IN_DIAGNOSIS', '09:00']);

    expect(history.current).toBe('IN_DIAGNOSIS');
    expect(history.entries[1]).toEqual({
      from: 'RECEIVED',
      to: 'IN_DIAGNOSIS',
      changedAt: at('09:00'),
    });
  });

  it('devolve um novo histórico, sem alterar o anterior', () => {
    const before = StatusHistory.start(at('08:00'));

    before.record('IN_DIAGNOSIS', at('09:00'));

    expect(before.entries).toHaveLength(1);
  });

  it('recusa uma transição inválida', () => {
    expect(() =>
      StatusHistory.start(at('08:00')).record('FINISHED', at('09:00')),
    ).toThrow(InvalidStatusTransitionError);
  });

  it('recusa uma mudança com data anterior à última', () => {
    expect(() =>
      StatusHistory.start(at('08:00')).record('IN_DIAGNOSIS', at('07:00')),
    ).toThrow(InvalidServiceOrderError);
  });

  it('reconstitui o histórico do banco, com o status atual', () => {
    const history = StatusHistory.restore([
      { from: null, to: 'RECEIVED', changedAt: at('08:00') },
      { from: 'RECEIVED', to: 'IN_DIAGNOSIS', changedAt: at('09:00') },
    ]);

    expect(history.current).toBe('IN_DIAGNOSIS');
    expect(history.entries).toHaveLength(2);
  });

  it('recusa reconstituir um histórico vazio', () => {
    expect(() => StatusHistory.restore([])).toThrow(InvalidServiceOrderError);
  });

  describe('executionTimeMs', () => {
    it('mede o intervalo entre Em execução e Finalizada', () => {
      const history = historyOf(
        ['IN_DIAGNOSIS', '09:00'],
        ['AWAITING_APPROVAL', '10:00'],
        ['IN_EXECUTION', '11:00'],
        ['FINISHED', '13:00'],
        ['DELIVERED', '15:00'],
      );

      expect(history.executionTimeMs()).toBe(2 * HOUR);
    });

    it('com reparo adicional, não conta a espera pela nova aprovação', () => {
      const history = historyOf(
        ['IN_DIAGNOSIS', '09:00'],
        ['AWAITING_APPROVAL', '10:00'],
        ['IN_EXECUTION', '11:00'],
        ['AWAITING_APPROVAL', '12:00'],
        ['IN_EXECUTION', '15:00'],
        ['FINISHED', '15:30'],
      );

      expect(history.executionTimeMs()).toBe(1.5 * HOUR);
    });

    it('é nulo para OS rejeitada no primeiro orçamento', () => {
      const history = historyOf(
        ['IN_DIAGNOSIS', '09:00'],
        ['AWAITING_APPROVAL', '10:00'],
        ['FINISHED', '10:30'],
      );

      expect(history.executionTimeMs()).toBeNull();
    });

    it('é nulo enquanto a OS ainda está em execução', () => {
      const history = historyOf(
        ['IN_DIAGNOSIS', '09:00'],
        ['AWAITING_APPROVAL', '10:00'],
        ['IN_EXECUTION', '11:00'],
      );

      expect(history.executionTimeMs()).toBeNull();
    });

    it('é nulo enquanto aguarda a aprovação de um reparo adicional', () => {
      const history = historyOf(
        ['IN_DIAGNOSIS', '09:00'],
        ['AWAITING_APPROVAL', '10:00'],
        ['IN_EXECUTION', '11:00'],
        ['AWAITING_APPROVAL', '12:00'],
      );

      expect(history.executionTimeMs()).toBeNull();
    });
  });
});
