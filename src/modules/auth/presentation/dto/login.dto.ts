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

export class CustomerLoginDto {
  @ApiProperty({ example: '529.982.247-25', description: 'CPF ou CNPJ' })
  @IsString()
  @IsNotEmpty({ message: 'Informe o CPF ou CNPJ' })
  document!: string;

  @ApiProperty({
    example: 'K7QM-4XPA',
    description: 'Código de acompanhamento impresso no recibo da OS',
  })
  @IsString()
  @IsNotEmpty({ message: 'Informe o código de acompanhamento' })
  trackingCode!: string;
}

export class LoginResponseDto {
  @ApiProperty({
    description: 'Token JWT para o cabeçalho Authorization: Bearer',
  })
  accessToken!: string;
}
