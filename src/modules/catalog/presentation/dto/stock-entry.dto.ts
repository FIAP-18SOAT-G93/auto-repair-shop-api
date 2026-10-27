import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class StockEntryDto {
  @ApiProperty({ example: 5, minimum: 1, description: 'Quantidade recebida' })
  @IsInt({ message: 'A quantidade deve ser um número inteiro' })
  @Min(1, { message: 'A quantidade da entrada deve ser de pelo menos 1' })
  quantity!: number;
}
