import { Injectable } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { PasswordHasher } from '../application/password-hasher.js';

const DEFAULT_COST = 10;

@Injectable()
export class BcryptPasswordHasher implements PasswordHasher {
  readonly #dummyHash: string;

  constructor(private readonly cost: number = DEFAULT_COST) {
    // Hash de uma senha qualquer, usado quando o usuário não existe.
    this.#dummyHash = bcrypt.hashSync('senha-inexistente', cost);
  }

  hash(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, this.cost);
  }

  async compare(
    plainPassword: string,
    passwordHash: string | null,
  ): Promise<boolean> {
    if (passwordHash === null) {
      await bcrypt.compare(plainPassword, this.#dummyHash);
      return false;
    }
    return bcrypt.compare(plainPassword, passwordHash);
  }
}
