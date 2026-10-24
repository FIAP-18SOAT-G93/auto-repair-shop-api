import { ApiProperty } from '@nestjs/swagger';

export class CustomerResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Maria da Silva' })
  name!: string;

  @ApiProperty({ example: '529.982.247-25' })
  document!: string;

  @ApiProperty({ enum: ['CPF', 'CNPJ'] })
  documentType!: 'CPF' | 'CNPJ';

  @ApiProperty({ example: 'maria@exemplo.com', nullable: true, type: String })
  email!: string | null;

  @ApiProperty({ example: '11987654321', nullable: true, type: String })
  phone!: string | null;
}

export class CustomerPageResponseDto {
  @ApiProperty({ type: [CustomerResponseDto] })
  items!: CustomerResponseDto[];

  @ApiProperty({ example: 42 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  pageSize!: number;
}
