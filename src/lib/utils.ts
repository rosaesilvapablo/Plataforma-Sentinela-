export type ClassValue = string | false | null | undefined;

export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}

export function assertNever(value: never, message?: string): never {
  throw new Error(message ?? `Caso nao tratado: ${String(value)}`);
}
