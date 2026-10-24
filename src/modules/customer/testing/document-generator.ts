/* Gera um CPF válido e aleatório para testes. */
export function generateCpf(): string {
  const base = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  if (base.every((digit) => digit === base[0])) {
    return generateCpf();
  }
  const first = checkDigit(base, 10);
  const second = checkDigit([...base, first], 11);
  return [...base, first, second].join('');
}

function checkDigit(digits: number[], firstWeight: number): number {
  const sum = digits.reduce(
    (acc, digit, index) => acc + digit * (firstWeight - index),
    0,
  );
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}
