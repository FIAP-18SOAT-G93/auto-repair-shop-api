import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsISO8601,
  IsOptional,
  IsUUID,
  Matches,
} from 'class-validator';
import { PaginationQueryDto } from '../../../../shared/infrastructure/http/pagination.query.dto.js';
import { ServiceOrderStatus } from '../../domain/service-order-status.js';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export class ListServiceOrdersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ServiceOrderStatus })
  @IsOptional()
  @IsEnum(ServiceOrderStatus, { message: 'Informe um status de OS válido' })
  status?: ServiceOrderStatus;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('all', { message: 'Informe um customerId válido (UUID)' })
  customerId?: string;

  @ApiPropertyOptional({
    example: '2026-10-01',
    description: 'Abertas a partir deste dia (AAAA-MM-DD, horário de Brasília)',
  })
  @IsOptional()
  @Matches(DATE_ONLY, { message: 'Informe a data inicial como AAAA-MM-DD' })
  @IsISO8601({ strict: true }, { message: 'Informe uma data inicial válida' })
  openedFrom?: string;

  @ApiPropertyOptional({
    example: '2026-10-31',
    description:
      'Abertas até este dia, inclusive (AAAA-MM-DD, horário de Brasília)',
  })
  @IsOptional()
  @Matches(DATE_ONLY, { message: 'Informe a data final como AAAA-MM-DD' })
  @IsISO8601({ strict: true }, { message: 'Informe uma data final válida' })
  openedTo?: string;
}
