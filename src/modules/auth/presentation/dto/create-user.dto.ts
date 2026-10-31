import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';
import { TeamRole } from '../../domain/role.js';

export class CreateUserDto {
  @ApiProperty({ example: 'Marco Antônio' })
  @IsString()
  @IsNotEmpty({ message: 'Informe o nome' })
  name!: string;

  @ApiProperty({ example: 'novo.mecanico@oficina.com' })
  @IsEmail({}, { message: 'Informe um e-mail válido' })
  email!: string;

  @ApiProperty({ example: 'SenhaForte@2026', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'A senha deve ter pelo menos 8 caracteres' })
  password!: string;

  @ApiProperty({ enum: TeamRole, example: TeamRole.MECHANIC })
  @IsEnum(TeamRole, { message: 'Função inválida' })
  role!: TeamRole;
}

export class CreateUserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;
}
