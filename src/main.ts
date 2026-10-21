import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ConfigService } from '@nestjs/config';
import type { Env } from './shared/infrastructure/config/env.validation.js';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  const config = app.get<ConfigService<Env, true>>(ConfigService);
  const swaggerConfig = new DocumentBuilder()
    .setTitle('API - Oficina Mecânica')
    .setDescription(
      'Gestão de ordens de serviço, clientes, veículos, serviços e estoque',
    )
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);
  await app.listen(config.get('PORT', { infer: true }));
}
await bootstrap();
