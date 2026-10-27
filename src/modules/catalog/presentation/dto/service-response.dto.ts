import { ApiProperty } from '@nestjs/swagger';

export class ServiceResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Alinhamento' })
  name!: string;

  @ApiProperty({
    example: 'Alinhamento das rodas dianteiras',
    nullable: true,
    type: String,
  })
  description!: string | null;

  @ApiProperty({ example: 89.9, description: 'Preço em reais' })
  price!: number;

  @ApiProperty({ example: 40, description: 'Tempo estimado, em minutos' })
  estimatedMinutes!: number;
}

export class ServicePageResponseDto {
  @ApiProperty({ type: [ServiceResponseDto] })
  items!: ServiceResponseDto[];

  @ApiProperty({ example: 6 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  pageSize!: number;
}
