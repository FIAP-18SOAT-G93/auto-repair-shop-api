export abstract class PasswordHasher {
  abstract hash(plainPassword: string): Promise<string>;
  abstract compare(
    plainPassword: string,
    passwordHash: string | null,
  ): Promise<boolean>;
}
