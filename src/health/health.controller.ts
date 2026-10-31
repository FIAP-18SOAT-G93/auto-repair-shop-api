import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Public } from '../modules/auth/presentation/decorators.js';
import { PrismaTransactionHost } from '../shared/infrastructure/database/prisma-transaction-host.js';

@ApiExcludeController()
@Controller('health')
export class HealthController {
  constructor(private readonly host: PrismaTransactionHost) {}

  @Public()
  @Get()
  async check(): Promise<{ status: 'ok' }> {
    try {
      await this.host.client.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException('Banco de dados indisponível');
    }
    return { status: 'ok' };
  }
}
