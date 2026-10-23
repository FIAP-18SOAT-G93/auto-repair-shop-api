import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  AccessTokenIssuer,
  type AccessTokenPayload,
} from '../application/access-token-issuer.js';

@Injectable()
export class JwtAccessTokenIssuer implements AccessTokenIssuer {
  constructor(private readonly jwtService: JwtService) {}

  issue(payload: AccessTokenPayload): Promise<string> {
    return this.jwtService.signAsync({ ...payload });
  }
}
