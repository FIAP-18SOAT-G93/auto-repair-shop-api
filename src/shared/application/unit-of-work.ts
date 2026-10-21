/**
 * Executa um trabalho de forma atômica. Ou todas as gravações feitas dentro
 * dele são confirmadas, ou nenhuma é. Se lançar um erro, tudo é desfeito.
 */
export abstract class UnitOfWork {
  abstract run<T>(work: () => Promise<T>): Promise<T>;
}
