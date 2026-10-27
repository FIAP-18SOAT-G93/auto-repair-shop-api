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
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../shared/infrastructure/http/pagination.query.dto.js';
import { Role } from '../../auth/domain/role.js';
import { Roles } from '../../auth/presentation/decorators.js';
import { CreateServiceUseCase } from '../application/create-service.use-case.js';
import { DeleteServiceUseCase } from '../application/delete-service.use-case.js';
import { GetServiceUseCase } from '../application/get-service.use-case.js';
import {
  type ListServicesOutput,
  ListServicesUseCase,
} from '../application/list-services.use-case.js';
import type { ServiceOutput } from '../application/service.output.js';
import { UpdateServiceUseCase } from '../application/update-service.use-case.js';
import { CreateServiceDto } from './dto/create-service.dto.js';
import {
  ServicePageResponseDto,
  ServiceResponseDto,
} from './dto/service-response.dto.js';
import { UpdateServiceDto } from './dto/update-service.dto.js';

@ApiTags('Serviços')
@ApiBearerAuth()
@Controller('services')
export class ServicesController {
  constructor(
    private readonly createService: CreateServiceUseCase,
    private readonly getService: GetServiceUseCase,
    private readonly listServices: ListServicesUseCase,
    private readonly updateService: UpdateServiceUseCase,
    private readonly deleteService: DeleteServiceUseCase,
  ) {}

  @Post()
  @Roles(Role.MANAGER)
  @ApiOperation({ summary: 'Cadastra um serviço no catálogo' })
  @ApiCreatedResponse({ type: ServiceResponseDto })
  @ApiForbiddenResponse({ description: 'Somente o gestor mantém o catálogo' })
  create(@Body() dto: CreateServiceDto): Promise<ServiceOutput> {
    return this.createService.execute(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lista o catálogo de serviços, em ordem alfabética',
  })
  @ApiOkResponse({ type: ServicePageResponseDto })
  list(@Query() query: PaginationQueryDto): Promise<ListServicesOutput> {
    return this.listServices.execute(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalha um serviço' })
  @ApiOkResponse({ type: ServiceResponseDto })
  @ApiNotFoundResponse({ description: 'Serviço não encontrado' })
  get(@Param('id', ParseUUIDPipe) id: string): Promise<ServiceOutput> {
    return this.getService.execute(id);
  }

  @Put(':id')
  @Roles(Role.MANAGER)
  @ApiOperation({
    summary: 'Altera um serviço',
  })
  @ApiOkResponse({ type: ServiceResponseDto })
  @ApiNotFoundResponse({ description: 'Serviço não encontrado' })
  @ApiForbiddenResponse({ description: 'Somente o gestor mantém o catálogo' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateServiceDto,
  ): Promise<ServiceOutput> {
    return this.updateService.execute(id, dto);
  }

  @Delete(':id')
  @Roles(Role.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um serviço do catálogo' })
  @ApiNoContentResponse({ description: 'Serviço removido' })
  @ApiNotFoundResponse({ description: 'Serviço não encontrado' })
  @ApiForbiddenResponse({ description: 'Somente o gestor mantém o catálogo' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.deleteService.execute(id);
  }
}
