/**
 * Removes a single leading zero from a string if present.
 * @param str - The string to process.
 * @returns The string with the leading zero removed, or the original string if no leading zero.
 */
export function removeLeadingZero(str: string): string {
  if (str.length <= 1) {
    return str;
  }
  return str.replace(/^0/, '');
}
