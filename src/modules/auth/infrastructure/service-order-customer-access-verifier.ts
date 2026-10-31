import { Injectable } from '@nestjs/common';
import { VerifyCustomerAccessUseCase } from '../../service-order/application/verify-customer-access.use-case.js';
import {
  CustomerAccessVerifier,
  type CustomerCredentials,
} from '../application/customer-access-verifier.js';

@Injectable()
export class ServiceOrderCustomerAccessVerifier implements CustomerAccessVerifier {
  constructor(private readonly verifyAccess: VerifyCustomerAccessUseCase) {}

  verify(credentials: CustomerCredentials): Promise<string | null> {
    return this.verifyAccess.execute(credentials);
  }
}
