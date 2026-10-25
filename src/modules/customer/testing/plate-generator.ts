const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const letter = () => LETTERS[Math.floor(Math.random() * LETTERS.length)];
const digit = () => String(Math.floor(Math.random() * 10));

/** Gera uma placa Mercosul aleatória para testes. */
export function generatePlate(): string {
  return `${letter()}${letter()}${letter()}${digit()}${letter()}${digit()}${digit()}`;
}
