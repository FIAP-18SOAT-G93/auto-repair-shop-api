import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PartType } from '../../domain/part-type.js';

export class CreatePartDto {
  @ApiProperty({
    example: 'Pastilha de freio dianteira',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'Informe o nome da peça' })
  @MaxLength(100, { message: 'O nome deve ter no máximo 100 caracteres' })
  name!: string;

  @ApiProperty({
    enum: PartType,
    example: PartType.PART,
    description: 'PART (peça) ou SUPPLY (insumo)',
  })
  @IsEnum(PartType, {
    message: 'O tipo deve ser PART (peça) ou SUPPLY (insumo)',
  })
  type!: PartType;

  @ApiProperty({
    example: 149.9,
    minimum: 0,
    description: 'Preço em reais, com até duas casas decimais',
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'O preço deve ser um número com até duas casas decimais' },
  )
  @Min(0, { message: 'O preço não pode ser negativo' })
  price!: number;

  @ApiProperty({ example: 10, minimum: 0, description: 'Saldo inicial' })
  @IsInt({ message: 'A quantidade deve ser um número inteiro' })
  @Min(0, { message: 'A quantidade não pode ser negativa' })
  quantity!: number;
}
