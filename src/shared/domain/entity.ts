export abstract class Entity<TId = string> {
  protected constructor(public readonly id: TId) {}

  equals(other?: Entity<TId>): boolean {
    if (!other) return false;
    if (this === other) return true;
    return other.constructor === this.constructor && other.id === this.id;
  }
}
