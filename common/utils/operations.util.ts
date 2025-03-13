
/**
 * Safely compares two values, taking into account floating point errors
 * 
 * @param a value to compare
 * @param b value to compare
 * @returns true if the values are equal, false otherwise
 */
export function safeEquals<T, U>(a: T, b: U): boolean {
  if (typeof a === 'number' && typeof b === 'number') {
    return Math.abs(a - b) < Number.EPSILON;
  } else if (typeof a === 'string' && typeof b === 'string') {
    return a as string === b as string;
  } else if (typeof a === 'boolean' && typeof b === 'boolean') {
    return a as boolean === b as boolean;
  } else if (typeof a === 'object' && typeof b === 'object') {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  return false;
}
