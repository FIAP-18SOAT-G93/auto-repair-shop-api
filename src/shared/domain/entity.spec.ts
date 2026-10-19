import { Entity } from './entity.js';

class Car extends Entity {
  constructor(
    id: string,
    public color: string,
  ) {
    super(id);
  }
}

class Motorcycle extends Entity {
  constructor(id: string) {
    super(id);
  }
}

describe('Entity', () => {
  it('considera iguais entidades do mesmo tipo com o mesmo id', () => {
    expect(new Car('1', 'preto').equals(new Car('1', 'vermelho'))).toBe(true);
  });

  it('considera diferentes entidades com ids diferentes', () => {
    expect(new Car('1', 'preto').equals(new Car('2', 'preto'))).toBe(false);
  });

  it('considera diferentes entidades de tipos diferentes com o mesmo id', () => {
    expect(new Car('1', 'preto').equals(new Motorcycle('1'))).toBe(false);
  });

  it('considera igual a própria instância', () => {
    const car = new Car('1', 'preto');
    expect(car.equals(car)).toBe(true);
  });

  it('retorna false ao comparar com undefined', () => {
    expect(new Car('1', 'preto').equals(undefined)).toBe(false);
  });
});
