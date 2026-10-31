import { randomInt } from 'node:crypto';
import { InvalidTrackingCodeError } from './service-order.errors.js';

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const LENGTH = 8;
const VALID_CODE = new RegExp(`^[${ALPHABET}]{${LENGTH}}$`);

export class TrackingCode {
  private constructor(readonly value: string) {}

  static generate(): TrackingCode {
    let value = '';
    for (let i = 0; i < LENGTH; i++) {
      value += ALPHABET[randomInt(ALPHABET.length)];
    }
    return new TrackingCode(value);
  }

  static parse(input: string): TrackingCode {
    const normalized = input
      .toUpperCase()
      .replace(/[\s-]+/g, '')
      .replace(/O/g, '0')
      .replace(/[IL]/g, '1');
    if (!VALID_CODE.test(normalized)) throw new InvalidTrackingCodeError();
    return new TrackingCode(normalized);
  }

  equals(other: TrackingCode): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return `${this.value.slice(0, 4)}-${this.value.slice(4)}`;
  }
}
