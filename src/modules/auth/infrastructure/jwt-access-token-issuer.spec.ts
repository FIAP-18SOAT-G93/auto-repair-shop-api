import { JwtService } from '@nestjs/jwt';
import { Role } from '../domain/role.js';
import { JwtAccessTokenIssuer } from './jwt-access-token-issuer.js';

describe('JwtAccessTokenIssuer', () => {
  const secret = 'segredo-de-teste-com-mais-de-32-caracteres';
  const jwtService = new JwtService({
    secret,
    signOptions: { expiresIn: '1h' },
  });
  const issuer = new JwtAccessTokenIssuer(jwtService);

  it('emite um token assinado com o id e a função do usuário', async () => {
    const token = await issuer.issue({ sub: 'user-1', role: Role.MECHANIC });

    const payload = await jwtService.verifyAsync<{ sub: string; role: string }>(
      token,
    );
    expect(payload.sub).toBe('user-1');
    expect(payload.role).toBe(Role.MECHANIC);
  });

  it('inclui a data de expiração no token', async () => {
    const token = await issuer.issue({ sub: 'user-1', role: Role.MECHANIC });

    const payload = jwtService.decode<{ iat: number; exp: number }>(token);
    expect(payload.exp - payload.iat).toBe(3600);
  });

  it('gera um token que não é aceito com outro segredo', async () => {
    const token = await issuer.issue({ sub: 'user-1', role: Role.MECHANIC });
    const otherService = new JwtService({
      secret: 'outro-segredo-com-mais-de-32-caracteres',
    });

    await expect(otherService.verifyAsync(token)).rejects.toThrow();
  });
});
