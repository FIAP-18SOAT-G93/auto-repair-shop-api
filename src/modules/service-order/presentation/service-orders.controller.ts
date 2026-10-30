import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '../../auth/domain/role.js';
import { Roles } from '../../auth/presentation/decorators.js';
import { AddPartToOrderUseCase } from '../application/add-part-to-order.use-case.js';
import { AddServiceToOrderUseCase } from '../application/add-service-to-order.use-case.js';
import { ApproveQuoteUseCase } from '../application/approve-quote.use-case.js';
import { ConcludeDiagnosisUseCase } from '../application/conclude-diagnosis.use-case.js';
import { GetServiceOrderUseCase } from '../application/get-service-order.use-case.js';
import { OpenServiceOrderUseCase } from '../application/open-service-order.use-case.js';
import { RejectQuoteUseCase } from '../application/reject-quote.use-case.js';
import type { ServiceOrderOutput } from '../application/service-order.output.js';
import { StartDiagnosisUseCase } from '../application/start-diagnosis.use-case.js';
import { AddPartDto, AddServiceDto } from './dto/add-items.dto.js';
import { OpenServiceOrderDto } from './dto/open-service-order.dto.js';
import { QuoteDecisionDto, RejectQuoteDto } from './dto/quote-decision.dto.js';
import { ServiceOrderResponseDto } from './dto/service-order-response.dto.js';

@ApiTags('Ordens de serviço')
@ApiBearerAuth()
@Controller('service-orders')
export class ServiceOrdersController {
  constructor(
    private readonly openServiceOrder: OpenServiceOrderUseCase,
    private readonly getServiceOrder: GetServiceOrderUseCase,
    private readonly startDiagnosis: StartDiagnosisUseCase,
    private readonly addService: AddServiceToOrderUseCase,
    private readonly addPart: AddPartToOrderUseCase,
    private readonly concludeDiagnosis: ConcludeDiagnosisUseCase,
    private readonly approveQuote: ApproveQuoteUseCase,
    private readonly rejectQuote: RejectQuoteUseCase,
  ) {}

  @Post()
  @Roles(Role.ATTENDANT, Role.MANAGER)
  @ApiOperation({
    summary: 'Abre uma OS, cadastrando cliente e veículo se necessário',
  })
  @ApiCreatedResponse({ type: ServiceOrderResponseDto })
  @ApiBadRequestResponse({
    description: 'Dados insuficientes para cadastrar cliente ou veículo',
  })
  @ApiConflictResponse({
    description: 'Veículo com OS aberta ou de outro cliente',
  })
  open(@Body() dto: OpenServiceOrderDto): Promise<ServiceOrderOutput> {
    return this.openServiceOrder.execute(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalha a OS com itens, orçamento e histórico' })
  @ApiOkResponse({ type: ServiceOrderResponseDto })
  @ApiNotFoundResponse({ description: 'OS não encontrada' })
  get(@Param('id', ParseUUIDPipe) id: string): Promise<ServiceOrderOutput> {
    return this.getServiceOrder.execute(id);
  }

  @Post(':id/start-diagnosis')
  @Roles(Role.MECHANIC, Role.MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Inicia o diagnóstico de uma OS recebida' })
  @ApiOkResponse({ type: ServiceOrderResponseDto })
  @ApiNotFoundResponse({ description: 'OS não encontrada' })
  @ApiConflictResponse({ description: 'A OS não está Recebida' })
  diagnose(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ServiceOrderOutput> {
    return this.startDiagnosis.execute(id);
  }

  @Post(':id/services')
  @Roles(Role.MECHANIC, Role.MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Inclui um serviço do catálogo no diagnóstico' })
  @ApiOkResponse({ type: ServiceOrderResponseDto })
  @ApiNotFoundResponse({ description: 'OS ou serviço não encontrado' })
  @ApiConflictResponse({ description: 'A OS não está Em diagnóstico' })
  includeService(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddServiceDto,
  ): Promise<ServiceOrderOutput> {
    return this.addService.execute({
      serviceOrderId: id,
      serviceId: dto.serviceId,
    });
  }

  @Post(':id/parts')
  @Roles(Role.MECHANIC, Role.MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Inclui uma peça no diagnóstico, com baixa no estoque',
  })
  @ApiOkResponse({ type: ServiceOrderResponseDto })
  @ApiNotFoundResponse({ description: 'OS ou peça não encontrada' })
  @ApiConflictResponse({
    description: 'Peça indisponível em estoque ou OS fora do diagnóstico',
  })
  includePart(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddPartDto,
  ): Promise<ServiceOrderOutput> {
    return this.addPart.execute({
      serviceOrderId: id,
      partId: dto.partId,
      quantity: dto.quantity,
    });
  }

  @Post(':id/conclude-diagnosis')
  @Roles(Role.MECHANIC, Role.MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Conclui o diagnóstico, gera o orçamento e avisa o cliente',
  })
  @ApiOkResponse({ type: ServiceOrderResponseDto })
  @ApiNotFoundResponse({ description: 'OS não encontrada' })
  @ApiConflictResponse({
    description: 'A OS não está Em diagnóstico ou não tem itens',
  })
  conclude(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ServiceOrderOutput> {
    return this.concludeDiagnosis.execute(id);
  }

  @Post(':id/approve-quote')
  @Roles(Role.ATTENDANT, Role.MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Registra a aprovação do orçamento e inicia a execução',
  })
  @ApiOkResponse({ type: ServiceOrderResponseDto })
  @ApiNotFoundResponse({ description: 'OS não encontrada' })
  @ApiConflictResponse({
    description: 'A OS não aguarda aprovação ou a versão não é a pendente',
  })
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: QuoteDecisionDto,
  ): Promise<ServiceOrderOutput> {
    return this.approveQuote.execute({
      serviceOrderId: id,
      version: dto.version,
    });
  }

  @Post(':id/reject-quote')
  @Roles(Role.ATTENDANT, Role.MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Registra a rejeição, estorna as peças e finaliza sem execução',
  })
  @ApiOkResponse({ type: ServiceOrderResponseDto })
  @ApiNotFoundResponse({ description: 'OS não encontrada' })
  @ApiConflictResponse({
    description: 'A OS não aguarda aprovação ou a versão não é a pendente',
  })
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectQuoteDto,
  ): Promise<ServiceOrderOutput> {
    return this.rejectQuote.execute({
      serviceOrderId: id,
      version: dto.version,
      reason: dto.reason,
    });
  }
}
