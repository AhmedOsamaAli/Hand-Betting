/**
 * Pure Fisher–Yates shuffle.
 *
 * Returns a new shuffled array; does not mutate the input. The randomness
 * source is injectable so tests can pass a deterministic generator.
 */
export function shuffle<T>(input: readonly T[], rng: () => number = Math.random): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
