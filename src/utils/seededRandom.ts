/**
 * 시드 기반 의사난수 (mulberry32) — 공급사 지연/실패 시뮬레이션을
 * 테스트에서 재현 가능하게 만든다. 고정 시나리오 모드에서는 시드를 고정한다.
 */
export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface RandomSource {
  next(): number;
  between(min: number, max: number): number;
  chance(probability: number): boolean;
}

export function createRandomSource(seed?: number): RandomSource {
  const fn = seed === undefined ? Math.random : createSeededRandom(seed);
  return {
    next: () => fn(),
    between: (min, max) => min + fn() * (max - min),
    chance: (p) => fn() < p,
  };
}
