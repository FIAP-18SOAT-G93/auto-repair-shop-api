import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './shared/infrastructure/config/env.validation.js';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { DomainExceptionFilter } from './shared/infrastructure/http/domain-exception.filter.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { CustomerModule } from './modules/customer/customer.module.js';
import { CatalogModule } from './modules/catalog/catalog.module.js';
import { ServiceOrderModule } from './modules/service-order/service-order.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    AuthModule,
    CustomerModule,
    CatalogModule,
    ServiceOrderModule,
  ],
  controllers: [],
  providers: [
    { provide: APP_FILTER, useClass: DomainExceptionFilter },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    },
  ],
})
export class AppModule {}
