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
import { CreatePartUseCase } from '../application/create-part.use-case.js';
import { DeletePartUseCase } from '../application/delete-part.use-case.js';
import { GetPartUseCase } from '../application/get-part.use-case.js';
import {
  type ListPartsOutput,
  ListPartsUseCase,
} from '../application/list-parts.use-case.js';
import type { PartOutput } from '../application/part.output.js';
import { RegisterStockEntryUseCase } from '../application/register-stock-entry.use-case.js';
import { UpdatePartUseCase } from '../application/update-part.use-case.js';
import { CreatePartDto } from './dto/create-part.dto.js';
import {
  PartPageResponseDto,
  PartResponseDto,
} from './dto/part-response.dto.js';
import { StockEntryDto } from './dto/stock-entry.dto.js';
import { UpdatePartDto } from './dto/update-part.dto.js';

@ApiTags('Peças e insumos')
@ApiBearerAuth()
@Controller('parts')
export class PartsController {
  constructor(
    private readonly createPart: CreatePartUseCase,
    private readonly getPart: GetPartUseCase,
    private readonly listParts: ListPartsUseCase,
    private readonly updatePart: UpdatePartUseCase,
    private readonly deletePart: DeletePartUseCase,
    private readonly registerStockEntry: RegisterStockEntryUseCase,
  ) {}

  @Post()
  @Roles(Role.MANAGER)
  @ApiOperation({
    summary: 'Cadastra uma peça ou insumo, com o saldo inicial',
  })
  @ApiCreatedResponse({ type: PartResponseDto })
  @ApiForbiddenResponse({ description: 'Somente o gestor mantém o estoque' })
  create(@Body() dto: CreatePartDto): Promise<PartOutput> {
    return this.createPart.execute(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista as peças e insumos, em ordem alfabética' })
  @ApiOkResponse({ type: PartPageResponseDto })
  list(@Query() query: PaginationQueryDto): Promise<ListPartsOutput> {
    return this.listParts.execute(query);
  }

  @Get('unavailable')
  @Roles(Role.MANAGER)
  @ApiOperation({ summary: 'Lista as peças sem saldo, para reposição' })
  @ApiOkResponse({ type: PartPageResponseDto })
  @ApiForbiddenResponse({ description: 'Somente o gestor repõe o estoque' })
  listUnavailable(
    @Query() query: PaginationQueryDto,
  ): Promise<ListPartsOutput> {
    return this.listParts.execute({ ...query, onlyOutOfStock: true });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalha uma peça ou insumo' })
  @ApiOkResponse({ type: PartResponseDto })
  @ApiNotFoundResponse({ description: 'Peça não encontrada' })
  get(@Param('id', ParseUUIDPipe) id: string): Promise<PartOutput> {
    return this.getPart.execute(id);
  }

  @Put(':id')
  @Roles(Role.MANAGER)
  @ApiOperation({
    summary: 'Altera nome, tipo e preço',
  })
  @ApiOkResponse({ type: PartResponseDto })
  @ApiNotFoundResponse({ description: 'Peça não encontrada' })
  @ApiForbiddenResponse({ description: 'Somente o gestor mantém o estoque' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePartDto,
  ): Promise<PartOutput> {
    return this.updatePart.execute(id, dto);
  }

  @Delete(':id')
  @Roles(Role.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove uma peça ou insumo' })
  @ApiNoContentResponse({ description: 'Peça removida' })
  @ApiNotFoundResponse({ description: 'Peça não encontrada' })
  @ApiForbiddenResponse({ description: 'Somente o gestor mantém o estoque' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.deletePart.execute(id);
  }

  @Post(':id/stock-entry')
  @Roles(Role.MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Registra uma entrada (reposição) de estoque' })
  @ApiOkResponse({
    type: PartResponseDto,
    description: 'Peça com o novo saldo',
  })
  @ApiNotFoundResponse({ description: 'Peça não encontrada' })
  @ApiForbiddenResponse({ description: 'Somente o gestor registra entradas' })
  stockEntry(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: StockEntryDto,
  ): Promise<PartOutput> {
    return this.registerStockEntry.execute({
      partId: id,
      quantity: dto.quantity,
    });
  }
}
