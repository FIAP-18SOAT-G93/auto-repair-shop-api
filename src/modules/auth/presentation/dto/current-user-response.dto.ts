import { ApiProperty } from '@nestjs/swagger';
import { TeamRole } from '../../domain/role.js';

export class CurrentUserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Jorge Christino' })
  name!: string;

  @ApiProperty({ example: 'gestor@oficina.com' })
  email!: string;

  @ApiProperty({ enum: TeamRole, example: TeamRole.MANAGER })
  role!: TeamRole;
}
