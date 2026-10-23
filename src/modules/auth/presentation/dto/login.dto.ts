import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'gestor@oficina.com' })
  @IsEmail({}, { message: 'Informe um e-mail válido' })
  email!: string;

  @ApiProperty({ example: 'Oficina@123' })
  @IsString()
  @IsNotEmpty({ message: 'Informe a senha' })
  password!: string;
}

export class LoginResponseDto {
  @ApiProperty({
    description: 'Token JWT para o cabeçalho Authorization: Bearer',
  })
  accessToken!: string;
}
