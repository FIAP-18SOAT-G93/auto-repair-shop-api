import { OmitType } from '@nestjs/swagger';
import { CreateCustomerDto } from './create-customer.dto.js';

export class UpdateCustomerDto extends OmitType(CreateCustomerDto, [
  'document',
] as const) {}
