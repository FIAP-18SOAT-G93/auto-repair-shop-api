import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '../../auth/domain/role.js';
import { Roles } from '../../auth/presentation/decorators.js';
import { CreateVehicleUseCase } from '../application/create-vehicle.use-case.js';
import { DeleteVehicleUseCase } from '../application/delete-vehicle.use-case.js';
import { FindVehicleByPlateUseCase } from '../application/find-vehicle-by-plate.use-case.js';
import { GetVehicleUseCase } from '../application/get-vehicle.use-case.js';
import {
  type ListVehiclesOutput,
  ListVehiclesUseCase,
} from '../application/list-vehicles.use-case.js';
import { UpdateVehicleUseCase } from '../application/update-vehicle.use-case.js';
import type { VehicleOutput } from '../application/vehicle.output.js';
import { CreateVehicleDto } from './dto/create-vehicle.dto.js';
import { FindVehicleByPlateQueryDto } from './dto/find-vehicle-by-plate.query.dto.js';
import { ListVehiclesQueryDto } from './dto/list-vehicles.query.dto.js';
import { UpdateVehicleDto } from './dto/update-vehicle.dto.js';
import {
  VehiclePageResponseDto,
  VehicleResponseDto,
} from './dto/vehicle-response.dto.js';

@ApiTags('Veículos')
@ApiBearerAuth()
@Controller('vehicles')
export class VehiclesController {
  constructor(
    private readonly createVehicle: CreateVehicleUseCase,
    private readonly getVehicle: GetVehicleUseCase,
    private readonly findByPlate: FindVehicleByPlateUseCase,
    private readonly listVehicles: ListVehiclesUseCase,
    private readonly updateVehicle: UpdateVehicleUseCase,
    private readonly deleteVehicle: DeleteVehicleUseCase,
  ) {}

  @Post()
  @Roles(Role.ATTENDANT, Role.MANAGER)
  @ApiOperation({ summary: 'Cadastra um veículo de um cliente' })
  @ApiCreatedResponse({ type: VehicleResponseDto })
  @ApiNotFoundResponse({ description: 'Cliente não encontrado' })
  @ApiConflictResponse({ description: 'Placa já cadastrada' })
  create(@Body() dto: CreateVehicleDto): Promise<VehicleOutput> {
    return this.createVehicle.execute(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lista os veículos, com filtro opcional por cliente',
  })
  @ApiOkResponse({ type: VehiclePageResponseDto })
  list(@Query() query: ListVehiclesQueryDto): Promise<ListVehiclesOutput> {
    return this.listVehicles.execute(query);
  }

  @Get('search')
  @ApiOperation({ summary: 'Busca um veículo pela placa' })
  @ApiOkResponse({ type: VehicleResponseDto })
  @ApiNotFoundResponse({ description: 'Veículo não encontrado' })
  search(@Query() query: FindVehicleByPlateQueryDto): Promise<VehicleOutput> {
    return this.findByPlate.execute(query.plate);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalha um veículo' })
  @ApiOkResponse({ type: VehicleResponseDto })
  @ApiNotFoundResponse({ description: 'Veículo não encontrado' })
  get(@Param('id', ParseUUIDPipe) id: string): Promise<VehicleOutput> {
    return this.getVehicle.execute(id);
  }

  @Put(':id')
  @Roles(Role.ATTENDANT, Role.MANAGER)
  @ApiOperation({
    summary: 'Altera marca, modelo e ano (placa e cliente não mudam)',
  })
  @ApiOkResponse({ type: VehicleResponseDto })
  @ApiNotFoundResponse({ description: 'Veículo não encontrado' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVehicleDto,
  ): Promise<VehicleOutput> {
    return this.updateVehicle.execute(id, dto);
  }

  @Delete(':id')
  @Roles(Role.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um veículo sem OS aberta (soft delete)' })
  @ApiNoContentResponse({ description: 'Veículo removido' })
  @ApiNotFoundResponse({ description: 'Veículo não encontrado' })
  @ApiConflictResponse({ description: 'Veículo com ordens de serviço abertas' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.deleteVehicle.execute(id);
  }
}
