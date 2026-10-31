import { InvalidTrackingCodeError } from './service-order.errors.js';
import { TrackingCode } from './tracking-code.js';

describe('TrackingCode', () => {
  it('gera códigos de 8 caracteres, sem I, L, O e U', () => {
    for (let i = 0; i < 500; i++) {
      expect(TrackingCode.generate().value).toMatch(/^[0-9A-HJKMNP-TV-Z]{8}$/);
    }
  });

  it('gera códigos diferentes a cada vez', () => {
    const codes = new Set(
      Array.from({ length: 1000 }, () => TrackingCode.generate().value),
    );

    expect(codes.size).toBe(1000);
  });

  it('exibe o código no formato XXXX-XXXX', () => {
    expect(TrackingCode.parse('K7QM4XPA').toString()).toBe('K7QM-4XPA');
  });

  it.each(['K7QM-4XPA', 'k7qm-4xpa', ' K7QM 4XPA ', 'K7QM4XPA'])(
    'aceita %j, com ou sem hífen, espaços e minúsculas',
    (input) => {
      expect(TrackingCode.parse(input).value).toBe('K7QM4XPA');
    },
  );

  it('troca as letras parecidas com números: O por 0, I e L por 1', () => {
    expect(TrackingCode.parse('oIl1-AAAA').value).toBe('0111AAAA');
  });

  it.each([
    ['curto demais', 'K7QM-4XP'],
    ['longo demais', 'K7QM-4XPAB'],
    ['com U', 'K7QM-4XPU'],
    ['com símbolo', 'K7QM-4XP!'],
    ['vazio', ''],
  ])('recusa um código %s', (_case, input) => {
    expect(() => TrackingCode.parse(input)).toThrow(InvalidTrackingCodeError);
  });

  it('compara pelo valor normalizado', () => {
    expect(
      TrackingCode.parse('k7qm-4xpa').equals(TrackingCode.parse('K7QM4XPA')),
    ).toBe(true);
  });
});
