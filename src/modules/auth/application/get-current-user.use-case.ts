import { Injectable } from '@nestjs/common';
import { UserNotFoundError } from '../domain/auth.errors.js';
import type { TeamRole } from '../domain/role.js';
import { UserRepository } from '../domain/user.repository.js';

export interface CurrentUserOutput {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
}

@Injectable()
export class GetCurrentUserUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(userId: string): Promise<CurrentUserOutput> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UserNotFoundError();
    }
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }
}
