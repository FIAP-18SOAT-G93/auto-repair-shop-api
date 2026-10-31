import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthenticateCustomerUseCase } from '../application/authenticate-customer.use-case.js';
import { GetCurrentUserUseCase } from '../application/get-current-user.use-case.js';
import { LoginUseCase } from '../application/login.use-case.js';
import type { AuthenticatedUser } from './authenticated-user.js';
import { CurrentUser, Public } from './decorators.js';
import { CurrentUserResponseDto } from './dto/current-user-response.dto.js';
import {
  CustomerLoginDto,
  LoginDto,
  LoginResponseDto,
} from './dto/login.dto.js';

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly getCurrentUser: GetCurrentUserUseCase,
    private readonly authenticateCustomerUseCase: AuthenticateCustomerUseCase,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Autentica um usuário da equipe e devolve o token JWT',
  })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiUnauthorizedResponse({ description: 'E-mail ou senha inválidos' })
  login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return this.loginUseCase.execute(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Dados do usuário autenticado' })
  @ApiOkResponse({ type: CurrentUserResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Token ausente, inválido ou expirado',
  })
  me(@CurrentUser() user: AuthenticatedUser): Promise<CurrentUserResponseDto> {
    return this.getCurrentUser.execute(user.id);
  }

  @Public()
  @Post('customer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Autentica o cliente pelo documento e pelo código de acompanhamento da OS',
  })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Documento ou código de acompanhamento inválidos',
  })
  authenticateCustomer(
    @Body() dto: CustomerLoginDto,
  ): Promise<LoginResponseDto> {
    return this.authenticateCustomerUseCase.execute({
      document: dto.document,
      trackingCode: dto.trackingCode,
    });
  }
}
