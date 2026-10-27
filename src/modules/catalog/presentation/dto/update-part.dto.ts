import { OmitType } from '@nestjs/swagger';
import { CreatePartDto } from './create-part.dto.js';

export class UpdatePartDto extends OmitType(CreatePartDto, [
  'quantity',
] as const) {}
