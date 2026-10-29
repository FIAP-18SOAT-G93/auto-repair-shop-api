import {
  ApiProperty,
  IntersectionType,
  OmitType,
  PartialType,
  PickType,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDefined, ValidateNested } from 'class-validator';
import { CreateCustomerDto } from '../../../customer/presentation/dto/create-customer.dto.js';
import { CreateVehicleDto } from '../../../customer/presentation/dto/create-vehicle.dto.js';

export class OrderCustomerDto extends IntersectionType(
  PickType(CreateCustomerDto, ['document'] as const),
  PartialType(OmitType(CreateCustomerDto, ['document'] as const)),
) {}

export class OrderVehicleDto extends IntersectionType(
  PickType(CreateVehicleDto, ['plate'] as const),
  PartialType(PickType(CreateVehicleDto, ['brand', 'model', 'year'] as const)),
) {}

export class OpenServiceOrderDto {
  @ApiProperty({
    type: OrderCustomerDto,
    description: 'Documento obrigatório, nome só para cliente novo',
  })
  @IsDefined({ message: 'Informe os dados do cliente' })
  @ValidateNested()
  @Type(() => OrderCustomerDto)
  customer!: OrderCustomerDto;

  @ApiProperty({
    type: OrderVehicleDto,
    description: 'Placa obrigatória, marca, modelo e ano só para veículo novo',
  })
  @IsDefined({ message: 'Informe os dados do veículo' })
  @ValidateNested()
  @Type(() => OrderVehicleDto)
  vehicle!: OrderVehicleDto;
}
