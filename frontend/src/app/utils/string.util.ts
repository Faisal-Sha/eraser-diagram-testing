const INVALID_CHAR_REGEXP = /[^a-zA-Z0-9-_ßöäüÖÄÜ]/g; 

/**
 * Converts a variable number of strings to a single string separated by underscores,
 * replacing any invalid characters with underscores.
 *
 * @remarks
 * Invalid characters are defined as any characters that are not alphanumeric, hyphen,
 * underscore, or the German umlauts (ß, ö, ä, ü, Ö, Ä, Ü).
 *
 * @param args - The strings to be converted.
 * @returns A single string separated by underscores, with invalid characters replaced by underscores.
 *
 * @example
 * ```typescript
 * convertToUnderscore('Hello', 'World', '123'); // Returns 'Hello_World_123'
 * convertToUnderscore('Hello', 'World!', '123'); // Returns 'Hello_World__123'
 * convertToUnderscore('Hällo', 'Wörld', '123'); // Returns 'Hällo_Wörld_123'
 * ```
 */
export function convertToUnderscore(...args: string[]): string {
  return args.map(arg => arg.replace(INVALID_CHAR_REGEXP, '_')).join('_');
}