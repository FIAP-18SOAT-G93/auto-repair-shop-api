import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({ example: 'Alinhamento', maxLength: 100 })
  @IsString()
  @IsNotEmpty({ message: 'Informe o nome do serviço' })
  @MaxLength(100, { message: 'O nome deve ter no máximo 100 caracteres' })
  name!: string;

  @ApiPropertyOptional({
    example: 'Alinhamento das rodas dianteiras',
    maxLength: 500,
    nullable: true,
    type: String,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'A descrição deve ter no máximo 500 caracteres' })
  description?: string | null;

  @ApiProperty({
    example: 89.9,
    minimum: 0,
    description: 'Preço em reais, com até duas casas decimais',
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'O preço deve ser um número com até duas casas decimais' },
  )
  @Min(0, { message: 'O preço não pode ser negativo' })
  price!: number;

  @ApiProperty({
    example: 40,
    minimum: 1,
    description: 'Tempo estimado de execução, em minutos',
  })
  @IsInt({ message: 'O tempo estimado deve ser um número inteiro de minutos' })
  @Min(1, { message: 'O tempo estimado deve ser de pelo menos 1 minuto' })
  estimatedMinutes!: number;
}
