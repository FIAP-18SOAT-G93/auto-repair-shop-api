import { Injectable } from '@nestjs/common';
import { EmailAlreadyInUseError } from '../domain/auth.errors.js';
import type { Role } from '../domain/role.js';
import { User } from '../domain/user.js';
import { UserRepository } from '../domain/user.repository.js';
import { PasswordHasher } from './password-hasher.js';

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: Role;
}

export interface CreateUserOutput {
  id: string;
}

@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  async execute(input: CreateUserInput): Promise<CreateUserOutput> {
    const email = User.normalizeEmail(input.email);
    if (await this.users.findByEmail(email)) {
      throw new EmailAlreadyInUseError();
    }

    const user = User.create({
      name: input.name,
      email,
      passwordHash: await this.hasher.hash(input.password),
      role: input.role,
    });
    await this.users.save(user);

    return { id: user.id };
  }
}
