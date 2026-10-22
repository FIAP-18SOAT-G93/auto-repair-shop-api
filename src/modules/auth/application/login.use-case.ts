import { Injectable } from '@nestjs/common';
import { InvalidCredentialsError } from '../domain/auth.errors.js';
import { User } from '../domain/user.js';
import { UserRepository } from '../domain/user.repository.js';
import { AccessTokenIssuer } from './access-token-issuer.js';
import { PasswordHasher } from './password-hasher.js';

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginOutput {
  accessToken: string;
}

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: AccessTokenIssuer,
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const normalizedInputEmail = User.normalizeEmail(input.email);
    const user = await this.users.findByEmail(normalizedInputEmail);
    const isSamePassword = await this.hasher.compare(
      input.password,
      user?.passwordHash ?? null,
    );
    if (!user || !isSamePassword) {
      throw new InvalidCredentialsError();
    }
    const accessToken = await this.tokens.issue({
      sub: user.id,
      role: user.role,
    });
    return { accessToken };
  }
}
