import { Prisma } from '@prisma/client';
import { cleanTranslations } from './translations';

/**
 * Convert a client-supplied translations payload into a Prisma-compatible Json value
 * (`Prisma.JsonNull` when empty so PostgreSQL clears the column cleanly).
 */
export function toPrismaTranslations<T extends Record<string, string | null | undefined>>(
  input: unknown,
  allowedFields?: (keyof T)[]
): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined {
  if (input === undefined) return undefined;
  const cleaned = cleanTranslations<T>(input, allowedFields);
  return cleaned ? (cleaned as Prisma.InputJsonValue) : Prisma.JsonNull;
}

/**
 * Convert a possibly-null JSON value from backup/import data to Prisma-safe Json input.
 */
export function toNullableJsonInput(
  value: unknown
): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined {
  if (value === undefined) return undefined;
  if (value === null) return Prisma.JsonNull;
  return value as Prisma.InputJsonValue;
}
