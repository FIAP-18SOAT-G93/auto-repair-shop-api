export interface CustomerCredentials {
  document: string;
  trackingCode: string;
}

export abstract class CustomerAccessVerifier {
  abstract verify(credentials: CustomerCredentials): Promise<string | null>;
}
