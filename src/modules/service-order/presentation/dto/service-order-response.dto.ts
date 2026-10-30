import { ApiProperty, PickType } from '@nestjs/swagger';
import { ServiceOrderStatus } from '../../domain/service-order-status.js';

class ItemQuoteResponseDto {
  @ApiProperty({
    example: 1,
    description: 'Versão do orçamento em que o item entrou',
  })
  quoteVersion!: number;

  @ApiProperty({
    enum: ['APPROVED', 'REJECTED'],
    nullable: true,
    description: 'Decisão do orçamento do item',
  })
  decision!: 'APPROVED' | 'REJECTED' | null;
}

class ServiceItemResponseDto extends ItemQuoteResponseDto {
  @ApiProperty({ format: 'uuid' })
  serviceId!: string;

  @ApiProperty({ example: 'Alinhamento' })
  name!: string;

  @ApiProperty({ example: 89.9, description: 'Preço congelado na inclusão' })
  price!: number;
}

class PartItemResponseDto extends ItemQuoteResponseDto {
  @ApiProperty({ format: 'uuid' })
  partId!: string;

  @ApiProperty({ example: 'Pastilha de freio dianteira' })
  name!: string;

  @ApiProperty({ example: 149.9, description: 'Preço congelado na inclusão' })
  unitPrice!: number;

  @ApiProperty({ example: 2 })
  quantity!: number;

  @ApiProperty({ example: 299.8 })
  total!: number;
}

class QuoteResponseDto {
  @ApiProperty({ example: 1 })
  version!: number;

  @ApiProperty({ example: 389.7 })
  total!: number;

  @ApiProperty()
  generatedAt!: Date;

  @ApiProperty({ enum: ['APPROVED', 'REJECTED'], nullable: true })
  decision!: 'APPROVED' | 'REJECTED' | null;

  @ApiProperty({ type: Date, nullable: true })
  decidedAt!: Date | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'Valor acima do esperado',
  })
  rejectionReason!: string | null;
}

class StatusChangeResponseDto {
  @ApiProperty({ enum: ServiceOrderStatus, nullable: true })
  from!: ServiceOrderStatus | null;

  @ApiProperty({ enum: ServiceOrderStatus })
  to!: ServiceOrderStatus;

  @ApiProperty()
  changedAt!: Date;
}

export class ServiceOrderResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 1042, description: 'Número da OS para o cliente' })
  number!: number;

  @ApiProperty({ format: 'uuid' })
  customerId!: string;

  @ApiProperty({ format: 'uuid' })
  vehicleId!: string;

  @ApiProperty({ enum: ServiceOrderStatus })
  status!: ServiceOrderStatus;

  @ApiProperty({ example: 'Em diagnóstico' })
  statusLabel!: string;

  @ApiProperty()
  openedAt!: Date;

  @ApiProperty({ type: [ServiceItemResponseDto] })
  services!: ServiceItemResponseDto[];

  @ApiProperty({ type: [PartItemResponseDto] })
  parts!: PartItemResponseDto[];

  @ApiProperty({
    example: 389.7,
    description: 'Soma dos orçamentos aprovados: o valor a pagar',
  })
  approvedTotal!: number;

  @ApiProperty({
    example: 601.7,
    description: 'Total aprovado mais o orçamento pendente, se houver',
  })
  totalIfApproved!: number;

  @ApiProperty({ type: QuoteResponseDto, nullable: true })
  quote!: QuoteResponseDto | null;

  @ApiProperty({ type: [StatusChangeResponseDto] })
  history!: StatusChangeResponseDto[];
}

export class ServiceOrderSummaryResponseDto extends PickType(
  ServiceOrderResponseDto,
  [
    'id',
    'number',
    'customerId',
    'vehicleId',
    'status',
    'statusLabel',
    'openedAt',
  ] as const,
) {}

export class ServiceOrderPageResponseDto {
  @ApiProperty({ type: [ServiceOrderSummaryResponseDto] })
  items!: ServiceOrderSummaryResponseDto[];

  @ApiProperty({ example: 42 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  pageSize!: number;
}
