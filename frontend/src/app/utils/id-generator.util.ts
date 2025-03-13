/**
 * Generates a numeric ID that is not present in the provided skip list.
 * The generated ID is a string representation of the next integer after the highest existing ID in the skip list.
 * If the skip list is empty, the generated ID starts from 10^(minLength-1).
 *
 * @param skipList - An array of existing IDs as strings. Default is an empty array.
 * @param minLength - The minimum length of the generated ID. Default is 4.
 * @returns A string representation of the generated numeric ID.
 */
export function generateNumericId(skipList: string[] = [], minLength: number = 4): string {
  const highestId = Math.max(...skipList.map((id) => parseInt(id, 10)), Math.pow(10, minLength - 1)-1);
  return (highestId+1).toString();
}
