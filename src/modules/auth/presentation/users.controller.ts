import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateUserUseCase } from '../application/create-user.use-case.js';
import { Role } from '../domain/role.js';
import { Roles } from './decorators.js';
import { CreateUserDto, CreateUserResponseDto } from './dto/create-user.dto.js';

@ApiTags('Usuários')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly createUser: CreateUserUseCase) {}

  @Post()
  @Roles(Role.MANAGER)
  @ApiOperation({ summary: 'Cadastra um usuário da equipe' })
  @ApiCreatedResponse({ type: CreateUserResponseDto })
  @ApiForbiddenResponse({
    description: 'Somente o gestor pode cadastrar usuários',
  })
  @ApiConflictResponse({ description: 'Já existe um usuário com este e-mail' })
  create(@Body() dto: CreateUserDto): Promise<CreateUserResponseDto> {
    return this.createUser.execute(dto);
  }
}
