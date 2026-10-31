import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '../../auth/domain/role.js';
import { Roles } from '../../auth/presentation/decorators.js';
import {
  AverageExecutionTimeQuery,
  type AverageExecutionTimeOutput,
} from '../application/average-execution-time.query.js';
import { AverageExecutionTimeResponseDto } from './dto/average-execution-time-response.dto.js';

@ApiTags('Métricas')
@ApiBearerAuth()
@Roles(Role.MANAGER)
@Controller('metrics')
export class MetricsController {
  constructor(
    private readonly averageExecutionTime: AverageExecutionTimeQuery,
  ) {}

  @Get('average-execution-time')
  @ApiOperation({
    summary: 'Tempo médio de execução das OS, geral e por serviço',
    description:
      'Soma dos períodos em execução de cada OS finalizada, sem a espera por aprovações. OS com o orçamento inicial rejeitado ficam de fora.',
  })
  @ApiOkResponse({ type: AverageExecutionTimeResponseDto })
  @ApiForbiddenResponse({
    description: 'Somente o gestor acompanha as métricas',
  })
  get(): Promise<AverageExecutionTimeOutput> {
    return this.averageExecutionTime.execute();
  }
}
