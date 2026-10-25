import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateVehicleDto {
  @ApiProperty({ format: 'uuid', description: 'Cliente dono do veículo' })
  @IsUUID('all', { message: 'Informe um customerId válido (UUID)' })
  customerId!: string;

  @ApiProperty({
    example: 'BRA2E19',
    description: 'Placa no padrão antigo (ABC-1234) ou Mercosul (ABC1D23)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Informe a placa' })
  plate!: string;

  @ApiProperty({ example: 'Volkswagen', maxLength: 60 })
  @IsString()
  @IsNotEmpty({ message: 'Informe a marca' })
  @MaxLength(60, { message: 'A marca deve ter no máximo 60 caracteres' })
  brand!: string;

  @ApiProperty({ example: 'Gol', maxLength: 60 })
  @IsString()
  @IsNotEmpty({ message: 'Informe o modelo' })
  @MaxLength(60, { message: 'O modelo deve ter no máximo 60 caracteres' })
  model!: string;

  @ApiProperty({ example: 2020 })
  @IsInt({ message: 'O ano deve ser um número inteiro' })
  year!: number;
}
