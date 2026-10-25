import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class FindVehicleByPlateQueryDto {
  @ApiProperty({ example: 'BRA2E19' })
  @IsString()
  @IsNotEmpty({ message: 'Informe a placa' })
  plate!: string;
}
