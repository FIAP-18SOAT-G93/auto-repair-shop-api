import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../../shared/infrastructure/http/pagination.query.dto.js';
import { IsOptional, IsUUID } from 'class-validator';

export class ListVehiclesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Cliente dono do veículo',
  })
  @IsOptional()
  @IsUUID('all', { message: 'Informe um customerId válido (UUID)' })
  customerId?: string;
}
