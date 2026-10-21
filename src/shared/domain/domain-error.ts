export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** Dado inválido para o domínio. Erro 400. */
export abstract class ValidationError extends DomainError {}

/** Recurso inexistente. Erro 404. */
export abstract class NotFoundError extends DomainError {}

/** Regra de negócio em conflito. Erro 409. */
export abstract class ConflictError extends DomainError {}
