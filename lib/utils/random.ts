/**
 * Mulberry32 seeded PRNG — fast, passes most statistical tests,
 * produces identical sequences for the same seed (essential for reproducible demos).
 */
export class SeededRandom {
  private state: number

  constructor(seed?: number) {
    this.state = (seed ?? Math.floor(Math.random() * 2 ** 32)) >>> 0
  }

  /** Returns a float in [0, 1) */
  next(): number {
    this.state = (this.state + 0x6D2B79F5) >>> 0
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  /** Integer in [min, max] inclusive */
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min
  }

  /** Float in [min, max] */
  float(min: number, max: number): number {
    return this.next() * (max - min) + min
  }

  /** Pick a random element from an array */
  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)]
  }

  /** Returns true with the given probability */
  chance(probability: number): boolean {
    return this.next() < probability
  }

  /** Weighted pick — items is an array of { weight, value } */
  weighted<T>(items: Array<{ weight: number; value: T }>): T {
    const total = items.reduce((s, i) => s + i.weight, 0)
    let r = this.next() * total
    for (const item of items) {
      r -= item.weight
      if (r <= 0) return item.value
    }
    return items[items.length - 1].value
  }

  /** Generate a random alphanumeric string of given length */
  alphaNum(length: number): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let result = ""
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(this.next() * chars.length)]
    }
    return result
  }
}
