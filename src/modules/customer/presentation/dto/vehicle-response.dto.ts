import { ApiProperty } from '@nestjs/swagger';

export class VehicleResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  customerId!: string;

  @ApiProperty({ example: 'BRA2E19' })
  plate!: string;

  @ApiProperty({ enum: ['OLD', 'MERCOSUL'] })
  plateType!: 'OLD' | 'MERCOSUL';

  @ApiProperty({ example: 'Volkswagen' })
  brand!: string;

  @ApiProperty({ example: 'Gol' })
  model!: string;

  @ApiProperty({ example: 2020 })
  year!: number;
}

export class VehiclePageResponseDto {
  @ApiProperty({ type: [VehicleResponseDto] })
  items!: VehicleResponseDto[];

  @ApiProperty({ example: 42 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  pageSize!: number;
}
