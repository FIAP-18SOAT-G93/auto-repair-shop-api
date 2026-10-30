import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class QuoteDecisionDto {
  @ApiProperty({
    example: 1,
    minimum: 1,
    description: 'Versão do orçamento que o cliente consultou',
  })
  @IsInt({ message: 'A versão do orçamento deve ser um número inteiro' })
  @Min(1, { message: 'A versão do orçamento deve ser a partir de 1' })
  version!: number;
}

export class RejectQuoteDto extends QuoteDecisionDto {
  @ApiPropertyOptional({ example: 'Valor acima do esperado', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'O motivo deve ter no máximo 500 caracteres' })
  reason!: string | null;
}
