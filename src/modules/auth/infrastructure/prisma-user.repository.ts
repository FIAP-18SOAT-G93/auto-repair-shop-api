import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaTransactionHost } from '../../../shared/infrastructure/database/prisma-transaction-host.js';
import { EmailAlreadyInUseError } from '../domain/auth.errors.js';
import { User } from '../domain/user.js';
import { UserRepository } from '../domain/user.repository.js';

type UserRecord = Prisma.UserGetPayload<object>;

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly host: PrismaTransactionHost) {}

  async save(user: User): Promise<void> {
    const data = {
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role,
    };
    try {
      await this.host.client.user.upsert({
        where: { id: user.id },
        create: { id: user.id, ...data },
        update: data,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new EmailAlreadyInUseError();
      }
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    const record = await this.host.client.user.findUnique({ where: { email } });
    return record ? toDomain(record) : null;
  }

  async findById(id: string): Promise<User | null> {
    const record = await this.host.client.user.findUnique({ where: { id } });
    return record ? toDomain(record) : null;
  }
}

function toDomain(record: UserRecord): User {
  return User.restore(record.id, {
    name: record.name,
    email: record.email,
    passwordHash: record.passwordHash,
    role: record.role,
  });
}
