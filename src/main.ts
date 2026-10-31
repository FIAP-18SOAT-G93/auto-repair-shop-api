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
    .addBearerAuth()
    .addTag('Autenticação', 'Login da equipe e do cliente')
    .addTag('Usuários', 'Cadastro dos usuários da equipe')
    .addTag('Clientes', 'Cadastro de clientes por CPF ou CNPJ')
    .addTag('Veículos', 'Cadastro de veículos dos clientes')
    .addTag('Serviços', 'Catálogo de serviços da oficina')
    .addTag('Peças e insumos', 'Estoque de peças e insumos')
    .addTag('Ordens de serviço', 'Ciclo da OS, do atendimento à entrega')
    .addTag('Acompanhamento do cliente', 'Rotas do aplicativo do cliente')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);
  await app.listen(config.get('PORT', { infer: true }));
}
await bootstrap();
