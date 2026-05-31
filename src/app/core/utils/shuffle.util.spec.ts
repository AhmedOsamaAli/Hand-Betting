import { shuffle } from './shuffle.util';

describe('shuffle', () => {
  it('returns an array of the same length and contents', () => {
    const input = [1, 2, 3, 4, 5];
    const out = shuffle(input);
    expect(out.length).toBe(input.length);
    expect([...out].sort()).toEqual([...input].sort());
  });

  it('does not mutate the input', () => {
    const input = [1, 2, 3, 4, 5];
    const snapshot = [...input];
    shuffle(input);
    expect(input).toEqual(snapshot);
  });

  it('is deterministic given a deterministic RNG', () => {
    const rng = mockRng([0.1, 0.2, 0.3, 0.4]);
    const out1 = shuffle([1, 2, 3, 4, 5], rng);
    const rng2 = mockRng([0.1, 0.2, 0.3, 0.4]);
    const out2 = shuffle([1, 2, 3, 4, 5], rng2);
    expect(out1).toEqual(out2);
  });
});

function mockRng(values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}
