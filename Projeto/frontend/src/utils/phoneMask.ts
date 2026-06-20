export function onlyPhoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Máscara BR: (11) 9999-9999 ou (11) 99999-9999 */
export function maskPhone(value: string): string {
  const digits = onlyPhoneDigits(value).slice(0, 11);

  if (digits.length === 0) {
    return "";
  }
  if (digits.length <= 2) {
    return `(${digits}`;
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

export function isValidPhone(value: string): boolean {
  const digits = onlyPhoneDigits(value);
  return digits.length === 10 || digits.length === 11;
}
