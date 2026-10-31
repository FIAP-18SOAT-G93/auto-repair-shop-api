import { Injectable } from '@nestjs/common';
import { InvalidCustomerCredentialsError } from '../domain/auth.errors.js';
import { Role } from '../domain/role.js';
import { AccessTokenIssuer } from './access-token-issuer.js';
import {
  CustomerAccessVerifier,
  type CustomerCredentials,
} from './customer-access-verifier.js';
import type { LoginOutput } from './login.use-case.js';

@Injectable()
export class AuthenticateCustomerUseCase {
  constructor(
    private readonly verifier: CustomerAccessVerifier,
    private readonly tokens: AccessTokenIssuer,
  ) {}

  async execute(credentials: CustomerCredentials): Promise<LoginOutput> {
    const customerId = await this.verifier.verify(credentials);
    if (!customerId) throw new InvalidCustomerCredentialsError();

    const accessToken = await this.tokens.issue({
      sub: customerId,
      role: Role.CUSTOMER,
    });
    return { accessToken };
  }
}
