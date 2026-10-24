import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Maria da Silva' })
  @IsString()
  @IsNotEmpty({ message: 'Informe o nome' })
  name!: string;

  @ApiProperty({
    example: '529.982.247-25',
    description: 'CPF ou CNPJ, com ou sem pontuação',
  })
  @IsString()
  @IsNotEmpty({ message: 'Informe o CPF ou CNPJ' })
  document!: string;

  @ApiPropertyOptional({ example: 'maria@exemplo.com', nullable: true })
  @IsOptional()
  @IsEmail({}, { message: 'Informe um e-mail válido' })
  email!: string | null;

  @ApiPropertyOptional({ example: '(11) 98765-4321', nullable: true })
  @IsOptional()
  @IsString()
  phone!: string | null;
}
