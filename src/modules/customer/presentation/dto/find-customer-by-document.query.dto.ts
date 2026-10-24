import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class FindCustomerByDocumentQueryDto {
  @ApiProperty({ example: '529.982.247-25' })
  @IsString()
  @IsNotEmpty({ message: 'Informe o CPF ou CNPJ' })
  document!: string;
}
