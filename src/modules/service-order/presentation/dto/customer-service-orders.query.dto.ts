import { OmitType } from '@nestjs/swagger';
import { ListServiceOrdersQueryDto } from './list-service-orders.query.dto.js';

export class CustomerServiceOrdersQueryDto extends OmitType(
  ListServiceOrdersQueryDto,
  ['customerId'] as const,
) {}
