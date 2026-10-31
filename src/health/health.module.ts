import { Module } from '@nestjs/common';
import { PrismaModule } from '../shared/infrastructure/database/prisma.module.js';
import { HealthController } from './health.controller.js';

@Module({
  imports: [PrismaModule],
  controllers: [HealthController],
})
export class HealthModule {}
