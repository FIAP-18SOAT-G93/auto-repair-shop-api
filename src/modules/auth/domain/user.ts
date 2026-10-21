import { randomUUID } from 'node:crypto';
import { AggregateRoot } from '../../../shared/domain/aggregate-root.js';
import { ValidationError } from '../../../shared/domain/domain-error.js';
import type { Role } from './role.js';

export class InvalidUserError extends ValidationError {}

interface UserProps {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class User extends AggregateRoot {
  private constructor(
    id: string,
    private readonly props: UserProps,
  ) {
    super(id);
  }

  static create(props: UserProps): User {
    return new User(randomUUID(), {
      name: User.validateName(props.name),
      email: User.validateEmail(props.email),
      passwordHash: props.passwordHash,
      role: props.role,
    });
  }

  static restore(id: string, props: UserProps): User {
    return new User(id, props);
  }

  get name(): string {
    return this.props.name;
  }

  get email(): string {
    return this.props.email;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get role(): Role {
    return this.props.role;
  }

  private static validateName(name: string): string {
    const trimmed = name.trim();
    if (trimmed.length < 1) {
      throw new InvalidUserError('O nome não deve ser vazio.');
    }
    return trimmed;
  }

  private static validateEmail(email: string): string {
    const normalized = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(normalized)) {
      throw new InvalidUserError(`E-mail inválido: ${email}`);
    }
    return normalized;
  }
}
