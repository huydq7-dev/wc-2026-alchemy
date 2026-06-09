export function getSingleValue(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : undefined;
  return undefined;
}

export function requireSingleValue(value: unknown): string {
  const normalized = getSingleValue(value);
  if (!normalized) {
    throw new Error('Expected a single string value');
  }
  return normalized;
}

export function isPick(value: unknown): value is 'A' | 'B' {
  return value === 'A' || value === 'B';
}
