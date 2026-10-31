import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule, type JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { Env } from '../../shared/infrastructure/config/env.validation.js';
import { PrismaModule } from '../../shared/infrastructure/database/prisma.module.js';
import { ServiceOrderModule } from '../service-order/service-order.module.js';
import { AccessTokenIssuer } from './application/access-token-issuer.js';
import { AuthenticateCustomerUseCase } from './application/authenticate-customer.use-case.js';
import { CreateUserUseCase } from './application/create-user.use-case.js';
import { CustomerAccessVerifier } from './application/customer-access-verifier.js';
import { GetCurrentUserUseCase } from './application/get-current-user.use-case.js';
import { LoginUseCase } from './application/login.use-case.js';
import { PasswordHasher } from './application/password-hasher.js';
import { UserRepository } from './domain/user.repository.js';
import { BcryptPasswordHasher } from './infrastructure/bcrypt-password-hasher.js';
import { JwtAccessTokenIssuer } from './infrastructure/jwt-access-token-issuer.js';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository.js';
import { ServiceOrderCustomerAccessVerifier } from './infrastructure/service-order-customer-access-verifier.js';
import { AuthController } from './presentation/auth.controller.js';
import { JwtAuthGuard } from './presentation/jwt-auth.guard.js';
import { JwtStrategy } from './presentation/jwt.strategy.js';
import { RolesGuard } from './presentation/roles.guard.js';
import { UsersController } from './presentation/users.controller.js';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    ServiceOrderModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        secret: config.get('JWT_SECRET', { infer: true }),
        signOptions: {
          expiresIn: config.get('JWT_EXPIRES_IN', {
            infer: true,
          }) as JwtSignOptions['expiresIn'],
        },
      }),
    }),
  ],
  controllers: [AuthController, UsersController],
  providers: [
    LoginUseCase,
    CreateUserUseCase,
    GetCurrentUserUseCase,
    AuthenticateCustomerUseCase,
    {
      provide: CustomerAccessVerifier,
      useClass: ServiceOrderCustomerAccessVerifier,
    },
    { provide: UserRepository, useClass: PrismaUserRepository },
    { provide: PasswordHasher, useFactory: () => new BcryptPasswordHasher() },
    { provide: AccessTokenIssuer, useClass: JwtAccessTokenIssuer },
    JwtStrategy,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AuthModule {}
