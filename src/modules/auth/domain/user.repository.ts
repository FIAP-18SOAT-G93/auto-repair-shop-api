import type { User } from './user.js';

export abstract class UserRepository {
  abstract save(user: User): Promise<User | null>;
  abstract findByEmail(email: string): Promise<User | null>;
  abstract findById(id: string): Promise<User | null>;
}
