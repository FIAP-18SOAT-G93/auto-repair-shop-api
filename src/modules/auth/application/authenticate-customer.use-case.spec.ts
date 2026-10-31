import { InvalidCustomerCredentialsError } from '../domain/auth.errors.js';
import {
  FakeAccessTokenIssuer,
  FakeCustomerAccessVerifier,
} from '../testing/fakes.js';
import { AuthenticateCustomerUseCase } from './authenticate-customer.use-case.js';

function setup() {
  const verifier = new FakeCustomerAccessVerifier();
  verifier.allow('52998224725', 'K7QM-4XPA', 'customer-1');
  const useCase = new AuthenticateCustomerUseCase(
    verifier,
    new FakeAccessTokenIssuer(),
  );
  return { useCase };
}

describe('AuthenticateCustomerUseCase', () => {
  it('devolve um token CUSTOMER com o id do cliente', async () => {
    const { useCase } = setup();

    const { accessToken } = await useCase.execute({
      document: '52998224725',
      trackingCode: 'K7QM-4XPA',
    });

    expect(accessToken).toBe('token:customer-1:CUSTOMER');
  });

  it('recusa documento e código que não conferem, sem dizer qual', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({ document: '52998224725', trackingCode: 'AAAA-AAAA' }),
    ).rejects.toThrow('Documento ou código de acompanhamento inválidos');
    await expect(
      useCase.execute({ document: '11144477735', trackingCode: 'K7QM-4XPA' }),
    ).rejects.toThrow(InvalidCustomerCredentialsError);
  });
});
