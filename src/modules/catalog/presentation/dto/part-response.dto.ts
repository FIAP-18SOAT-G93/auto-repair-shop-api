import { ApiProperty } from '@nestjs/swagger';
import { PartType } from '../../domain/part-type.js';

export class PartResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Pastilha de freio dianteira (jogo)' })
  name!: string;

  @ApiProperty({ enum: PartType, example: PartType.PART })
  type!: PartType;

  @ApiProperty({ example: 149.9, description: 'Preço em reais' })
  price!: number;

  @ApiProperty({ example: 8, description: 'Saldo em estoque' })
  quantity!: number;
}

export class PartPageResponseDto {
  @ApiProperty({ type: [PartResponseDto] })
  items!: PartResponseDto[];

  @ApiProperty({ example: 6 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  pageSize!: number;
}
