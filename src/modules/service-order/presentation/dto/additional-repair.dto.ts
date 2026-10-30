import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsUUID, ValidateNested } from 'class-validator';
import { AddPartDto } from './add-items.dto.js';

export class AdditionalRepairDto {
  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description: 'Serviços do catálogo',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', {
    each: true,
    message: 'Cada serviço deve ser um id válido (UUID)',
  })
  services?: string[];

  @ApiPropertyOptional({ type: [AddPartDto], description: 'Peças e insumos' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddPartDto)
  parts?: AddPartDto[];
}
