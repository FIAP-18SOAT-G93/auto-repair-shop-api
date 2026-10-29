import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID, Min } from 'class-validator';

export class AddServiceDto {
  @ApiProperty({ format: 'uuid', description: 'Serviço do catálogo' })
  @IsUUID('all', { message: 'Informe um serviceId válido (UUID)' })
  serviceId!: string;
}

export class AddPartDto {
  @ApiProperty({ format: 'uuid', description: 'Peça ou insumo do estoque' })
  @IsUUID('all', { message: 'Informe um partId válido (UUID)' })
  partId!: string;

  @ApiProperty({ example: 2, minimum: 1 })
  @IsInt({ message: 'A quantidade deve ser um número inteiro' })
  @Min(1, { message: 'A quantidade deve ser de pelo menos 1' })
  quantity!: number;
}
