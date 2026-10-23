import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';
import { Role } from '../../domain/role.js';

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

  @ApiProperty({ enum: Role, example: Role.MECHANIC })
  @IsEnum(Role, { message: 'Função inválida' })
  role!: Role;
}

export class CreateUserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;
}
