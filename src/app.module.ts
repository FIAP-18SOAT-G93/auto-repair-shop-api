import { Module, ValidationPipe } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './shared/infrastructure/config/env.validation.js';
import { PrismaModule } from './shared/infrastructure/database/prisma.module.js';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { DomainExceptionFilter } from './shared/infrastructure/http/domain-exception.filter.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
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
