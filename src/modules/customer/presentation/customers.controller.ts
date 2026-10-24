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
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '../../auth/domain/role.js';
import { Roles } from '../../auth/presentation/decorators.js';
import { CreateCustomerUseCase } from '../application/create-customer.use-case.js';
import type { CustomerOutput } from '../application/customer.output.js';
import { DeleteCustomerUseCase } from '../application/delete-customer.use-case.js';
import { FindCustomerByDocumentUseCase } from '../application/find-customer-by-document.use-case.js';
import { GetCustomerUseCase } from '../application/get-customer.use-case.js';
import {
  type ListCustomersOutput,
  ListCustomersUseCase,
} from '../application/list-customers.use-case.js';
import { UpdateCustomerUseCase } from '../application/update-customer.use-case.js';
import { CreateCustomerDto } from './dto/create-customer.dto.js';
import {
  CustomerPageResponseDto,
  CustomerResponseDto,
} from './dto/customer-response.dto.js';
import { FindCustomerByDocumentQueryDto } from './dto/find-customer-by-document.query.dto.js';
import { ListCustomersQueryDto } from './dto/list-customers.query.dto.js';
import { UpdateCustomerDto } from './dto/update-customer.dto.js';

@ApiTags('Clientes')
@ApiBearerAuth()
@Controller('customers')
export class CustomersController {
  constructor(
    private readonly createCustomer: CreateCustomerUseCase,
    private readonly getCustomer: GetCustomerUseCase,
    private readonly findByDocument: FindCustomerByDocumentUseCase,
    private readonly listCustomers: ListCustomersUseCase,
    private readonly updateCustomer: UpdateCustomerUseCase,
    private readonly deleteCustomer: DeleteCustomerUseCase,
  ) {}

  @Post()
  @Roles(Role.ATTENDANT, Role.MANAGER)
  @ApiOperation({ summary: 'Cadastra um cliente' })
  @ApiCreatedResponse({ type: CustomerResponseDto })
  @ApiConflictResponse({ description: 'CPF/CNPJ já cadastrado' })
  create(@Body() dto: CreateCustomerDto): Promise<CustomerOutput> {
    return this.createCustomer.execute(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lista os clientes, do mais recente ao mais antigo',
  })
  @ApiOkResponse({ type: CustomerPageResponseDto })
  list(@Query() query: ListCustomersQueryDto): Promise<ListCustomersOutput> {
    return this.listCustomers.execute(query);
  }

  @Get('search')
  @ApiOperation({ summary: 'Busca um cliente pelo CPF/CNPJ' })
  @ApiOkResponse({ type: CustomerResponseDto })
  @ApiNotFoundResponse({ description: 'Cliente não encontrado' })
  search(
    @Query() query: FindCustomerByDocumentQueryDto,
  ): Promise<CustomerOutput> {
    return this.findByDocument.execute(query.document);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalha um cliente' })
  @ApiOkResponse({ type: CustomerResponseDto })
  @ApiNotFoundResponse({ description: 'Cliente não encontrado' })
  get(@Param('id', ParseUUIDPipe) id: string): Promise<CustomerOutput> {
    return this.getCustomer.execute(id);
  }

  @Put(':id')
  @Roles(Role.ATTENDANT, Role.MANAGER)
  @ApiOperation({ summary: 'Altera dados do cliente' })
  @ApiOkResponse({ type: CustomerResponseDto })
  @ApiNotFoundResponse({ description: 'Cliente não encontrado' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
  ): Promise<CustomerOutput> {
    return this.updateCustomer.execute(id, dto);
  }

  @Delete(':id')
  @Roles(Role.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Remove um cliente sem OS aberta (soft delete: o histórico é mantido)',
  })
  @ApiNoContentResponse({ description: 'Cliente removido' })
  @ApiNotFoundResponse({ description: 'Cliente não encontrado' })
  @ApiForbiddenResponse({
    description: 'Somente o gestor pode remover clientes',
  })
  @ApiConflictResponse({ description: 'Cliente com ordens de serviço abertas' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.deleteCustomer.execute(id);
  }
}
