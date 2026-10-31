import {
  AccessTokenIssuer,
  type AccessTokenPayload,
} from '../application/access-token-issuer.js';
import {
  CustomerAccessVerifier,
  type CustomerCredentials,
} from '../application/customer-access-verifier.js';
import { PasswordHasher } from '../application/password-hasher.js';
import type { User } from '../domain/user.js';
import { UserRepository } from '../domain/user.repository.js';

export class InMemoryUserRepository implements UserRepository {
  readonly users = new Map<string, User>();

  async save(user: User): Promise<void> {
    this.users.set(user.id, user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return [...this.users.values()].find((u) => u.email === email) ?? null;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }
}

export class FakePasswordHasher implements PasswordHasher {
  async hash(plainPassword: string): Promise<string> {
    return `hashed:${plainPassword}`;
  }

  async compare(
    plainPassword: string,
    passwordHash: string | null,
  ): Promise<boolean> {
    return passwordHash === `hashed:${plainPassword}`;
  }
}

export class FakeCustomerAccessVerifier implements CustomerAccessVerifier {
  readonly accesses = new Map<string, string>();

  allow(document: string, trackingCode: string, customerId: string): void {
    this.accesses.set(`${document}|${trackingCode}`, customerId);
  }

  async verify({
    document,
    trackingCode,
  }: CustomerCredentials): Promise<string | null> {
    return this.accesses.get(`${document}|${trackingCode}`) ?? null;
  }
}

export class FakeAccessTokenIssuer implements AccessTokenIssuer {
  async issue(payload: AccessTokenPayload): Promise<string> {
    return `token:${payload.sub}:${payload.role}`;
  }
}
