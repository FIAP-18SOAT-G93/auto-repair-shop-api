import { OmitType } from '@nestjs/swagger';
import { CreateVehicleDto } from './create-vehicle.dto.js';

export class UpdateVehicleDto extends OmitType(CreateVehicleDto, [
  'customerId',
  'plate',
] as const) {}
