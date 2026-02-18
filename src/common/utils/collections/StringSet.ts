/**
 * A simple set implementation that similar the implementation of the es6 Set but uses an object internally
 * for browser compatibility and avoiding performance pitfalls of polyfills when they aren't really needed.
 * Since this implementation uses an object internally, it does not have the same properties of the es6 Set.
 * For example, it does not preserve the insertion order. If you need that, use the es6 Set.
 * @param T - The type of the items in the set.
 */
export class StringSet {
  private _set: Record<string, boolean>;

  private _size: number;

  constructor(keys?: string[] | StringSet | Set<string>) {
    this._set = {};
    this._size = 0;

    const existingKeys = keys instanceof StringSet ? keys.values() : keys || [];
    existingKeys.forEach(key => this.add(key));
  }

  /** Returns true if the key is in the set */
  has(key: string): boolean {
    return key in this._set;
  }

  /** Adds a new element with a specified value to the Set. */
  add(key: string): void {
    if (!this.has(key)) {
      this._set[key] = true;
      this._size++;
    }
  }

  /** Removes the specified element from the Set. */
  delete(key: string): void {
    if (this.has(key)) {
      delete this._set[key];
      this._size--;
    }
  }

  /** Removes all elements from the Set. */
  clear(): void {
    this._set = {};
    this._size = 0;
  }

  /** Returns the number of elements in the Set. */
  get size(): number {
    return this._size;
  }

  /** Returns an array of all the keys in the Set. */
  keys(): string[] {
    return Object.keys(this._set);
  }

  /** Returns an array of all the values in the Set. */
  values(): string[] {
    return this.keys();
  }

  /** Executes a provided function once per each value in the Set, in insertion order. */
  forEach(callback: (key: string) => void): void {
    this.keys().forEach(key => callback(key));
  }

  /** Returns the next key in the Set, or undefined if there are no more keys. */
  next(): string | undefined {
    if (this._size === 0) {
      return undefined;
    }
    return this.keys()[this._size - 1];
  }
}
