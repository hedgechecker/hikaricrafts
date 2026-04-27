/**
 * Parses a String into a Math expression and evaluates it
 * @param value The Value that could be a Math expression
 * @returns null if the value is not a valid expression,
 * else the value of the calculated Expression
 */
export function parseMathInput(value: string): number | null {
  if (!value) return null;

  let normalized = value.replace(/,/g, ".").trim();
  normalized = normalized.replaceAll("m", "");
  normalized = normalized.replace("°", "");

  // allow only numbers and math operators
  if (!/^[0-9+\-*/().\s]+$/.test(normalized)) {
    return null;
  }

  try {
    const result = Function(`"use strict"; return (${normalized})`)();

    if (typeof result !== "number" || !isFinite(result)) {
      return null;
    }

    return result;
  } catch {
    return null;
  }
}
