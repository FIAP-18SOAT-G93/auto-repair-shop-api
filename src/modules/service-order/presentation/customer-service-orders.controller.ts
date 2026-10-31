import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '../../auth/domain/role.js';
import type { AuthenticatedUser } from '../../auth/presentation/authenticated-user.js';
import { CurrentUser, Roles } from '../../auth/presentation/decorators.js';
import { ApproveQuoteUseCase } from '../application/approve-quote.use-case.js';
import { GetServiceOrderUseCase } from '../application/get-service-order.use-case.js';
import {
  type ListServiceOrdersOutput,
  ListServiceOrdersUseCase,
} from '../application/list-service-orders.use-case.js';
import { RejectQuoteUseCase } from '../application/reject-quote.use-case.js';
import type { ServiceOrderOutput } from '../application/service-order.output.js';
import { CustomerServiceOrdersQueryDto } from './dto/customer-service-orders.query.dto.js';
import { QuoteDecisionDto, RejectQuoteDto } from './dto/quote-decision.dto.js';
import {
  ServiceOrderPageResponseDto,
  ServiceOrderResponseDto,
} from './dto/service-order-response.dto.js';

@ApiTags('Acompanhamento do cliente')
@ApiBearerAuth()
@ApiForbiddenResponse({ description: 'Somente o cliente acessa estas rotas' })
@Roles(Role.CUSTOMER)
@Controller('customer/service-orders')
export class CustomerServiceOrdersController {
  constructor(
    private readonly listServiceOrders: ListServiceOrdersUseCase,
    private readonly getServiceOrder: GetServiceOrderUseCase,
    private readonly approveQuote: ApproveQuoteUseCase,
    private readonly rejectQuote: RejectQuoteUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lista as OS do cliente autenticado' })
  @ApiOkResponse({ type: ServiceOrderPageResponseDto })
  list(
    @CurrentUser() customer: AuthenticatedUser,
    @Query() query: CustomerServiceOrdersQueryDto,
  ): Promise<ListServiceOrdersOutput> {
    return this.listServiceOrders.execute({
      customerId: customer.id,
      status: query.status,
      openedFrom: query.openedFrom,
      openedTo: query.openedTo,
      page: query.page,
      pageSize: query.pageSize,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Acompanha uma OS do cliente autenticado' })
  @ApiOkResponse({ type: ServiceOrderResponseDto })
  @ApiNotFoundResponse({ description: 'OS não encontrada' })
  get(
    @CurrentUser() customer: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ServiceOrderOutput> {
    return this.getServiceOrder.execute(id, customer.id);
  }

  @Post(':id/approve-quote')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aprova o orçamento pendente da OS' })
  @ApiOkResponse({ type: ServiceOrderResponseDto })
  @ApiNotFoundResponse({ description: 'OS não encontrada' })
  @ApiConflictResponse({
    description: 'A OS não aguarda aprovação ou a versão não é a pendente',
  })
  approve(
    @CurrentUser() customer: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: QuoteDecisionDto,
  ): Promise<ServiceOrderOutput> {
    return this.approveQuote.execute({
      serviceOrderId: id,
      version: dto.version,
      ownerId: customer.id,
    });
  }

  @Post(':id/reject-quote')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rejeita o orçamento pendente da OS' })
  @ApiOkResponse({ type: ServiceOrderResponseDto })
  @ApiNotFoundResponse({ description: 'OS não encontrada' })
  @ApiConflictResponse({
    description: 'A OS não aguarda aprovação ou a versão não é a pendente',
  })
  reject(
    @CurrentUser() customer: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectQuoteDto,
  ): Promise<ServiceOrderOutput> {
    return this.rejectQuote.execute({
      serviceOrderId: id,
      version: dto.version,
      reason: dto.reason,
      ownerId: customer.id,
    });
  }
}
