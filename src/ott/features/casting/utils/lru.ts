/**
 * Lightweight LRU Set implementation for deduplication
 */

export class LruSet {
  private max: number;
  private set = new Set<string>();

  constructor(max = 100) {
    this.max = max;
  }

  has(id: string): boolean {
    return this.set.has(id);
  }

  add(id: string): void {
    if (this.set.has(id)) return;

    this.set.add(id);

    // Evict oldest entry if exceeding max size
    if (this.set.size > this.max) {
      const first = this.set.values().next().value;
      /* istanbul ignore else */
      if (first !== undefined) {
        this.set.delete(first);
      }
    }
  }

  clear(): void {
    this.set.clear();
  }

  size(): number {
    return this.set.size;
  }
}

