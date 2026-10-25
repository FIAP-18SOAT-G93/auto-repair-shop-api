import { ValidationError } from '../../../shared/domain/domain-error.js';

export class InvalidLicensePlateError extends ValidationError {
  constructor() {
    super(
      'Placa inválida: use o padrão antigo (ABC-1234) ou Mercosul (ABC1D23)',
    );
  }
}

export type LicensePlateType = 'OLD' | 'MERCOSUL';

const OLD_PATTERN = /^[A-Z]{3}[0-9]{4}$/;
const MERCOSUL_PATTERN = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;

export class LicensePlate {
  private constructor(
    readonly value: string,
    readonly type: LicensePlateType,
  ) {}

  static create(input: string): LicensePlate {
    const value = input.replace(/[-\s]/g, '').toUpperCase();

    if (OLD_PATTERN.test(value)) {
      return new LicensePlate(value, 'OLD');
    }
    if (MERCOSUL_PATTERN.test(value)) {
      return new LicensePlate(value, 'MERCOSUL');
    }
    throw new InvalidLicensePlateError();
  }

  format(): string {
    return this.type === 'OLD'
      ? `${this.value.slice(0, 3)}-${this.value.slice(3)}`
      : this.value;
  }

  equals(other: LicensePlate): boolean {
    return this.value === other.value;
  }
}
