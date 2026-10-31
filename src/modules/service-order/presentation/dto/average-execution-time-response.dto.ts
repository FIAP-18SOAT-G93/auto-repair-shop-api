import { ApiProperty } from '@nestjs/swagger';

class ExecutionTimeAverageDto {
  @ApiProperty({
    type: Number,
    nullable: true,
    example: 95.5,
    description:
      'Tempo médio em execução, em minutos (null sem OS finalizadas)',
  })
  averageMinutes!: number | null;

  @ApiProperty({ example: 12, description: 'OS consideradas na média' })
  orders!: number;
}

class ServiceExecutionTimeAverageDto extends ExecutionTimeAverageDto {
  @ApiProperty({ format: 'uuid' })
  serviceId!: string;

  @ApiProperty({ example: 'Alinhamento' })
  name!: string;
}

export class AverageExecutionTimeResponseDto {
  @ApiProperty({ type: ExecutionTimeAverageDto })
  overall!: ExecutionTimeAverageDto;

  @ApiProperty({
    type: [ServiceExecutionTimeAverageDto],
    description: 'Média das OS em que cada serviço foi executado',
  })
  byService!: ServiceExecutionTimeAverageDto[];
}
