import { ValidationError } from '../../../shared/domain/domain-error.js';

export class InvalidDocumentError extends ValidationError {
  constructor() {
    super('CPF ou CNPJ inválido');
  }
}

export type DocumentType = 'CPF' | 'CNPJ';

const CPF_PATTERN = /^\d{11}$/;
const CNPJ_PATTERN = /^[0-9A-Z]{12}\d{2}$/;

const CPF_WEIGHTS = {
  first: [10, 9, 8, 7, 6, 5, 4, 3, 2],
  second: [11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
};
const CNPJ_WEIGHTS = {
  first: [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  second: [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
};

export class Document {
  private constructor(
    readonly value: string,
    readonly type: DocumentType,
  ) {}

  static create(input: string): Document {
    const value = input.replace(/[.\-/\s]/g, '').toUpperCase();

    if (CPF_PATTERN.test(value) && hasValidCheckDigits(value, CPF_WEIGHTS)) {
      return new Document(value, 'CPF');
    }
    if (CNPJ_PATTERN.test(value) && hasValidCheckDigits(value, CNPJ_WEIGHTS)) {
      return new Document(value, 'CNPJ');
    }
    throw new InvalidDocumentError();
  }

  format(): string {
    const v = this.value;
    return this.type === 'CPF'
      ? `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6, 9)}-${v.slice(9)}`
      : `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5, 8)}/${v.slice(8, 12)}-${v.slice(12)}`;
  }

  equals(other: Document): boolean {
    return this.value === other.value;
  }
}

function hasValidCheckDigits(
  value: string,
  weights: { first: number[]; second: number[] },
): boolean {
  if (/^(.)\1+$/.test(value)) {
    return false;
  }
  const base = value.slice(0, weights.first.length);
  const first = calculateCheckDigit(base, weights.first);
  const second = calculateCheckDigit(base + first, weights.second);
  return value === `${base}${first}${second}`;
}

function calculateCheckDigit(base: string, weights: number[]): number {
  const sum = weights.reduce(
    (acc, cur, index) => acc + cur * (base.charCodeAt(index) - 48),
    0,
  );
  const remainder = sum % 11;
  if (remainder < 2) return 0;
  return 11 - remainder;
}
