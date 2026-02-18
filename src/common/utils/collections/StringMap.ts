/**
 * A simple map implementation that is similar the implementation of the es6 Map but uses an object internally
 * for browser compatibility and avoiding performance pitfalls of polyfills when they aren't really needed.
 * Since this implementation uses an object internally, it does not have the same properties of the es6 Map.
 * For example, it does not preserve the insertion order. If you need that, use the es6 Map.
 * @param V - The type of the values in the map.
 */
export class StringMap<V> {
  private _map: Record<string, V>;

  private _size: number;

  constructor(entries?: [string, V][] | StringMap<V> | Map<string, V>) {
    this._map = {};
    this._size = 0;

    if (!entries) {
      return;
    }

    if (entries instanceof StringMap) {
      entries.forEach((value, key) => this.set(key, value));
    } else if (entries instanceof Map) {
      // ES6 Map
      entries.forEach((value, key) => this.set(key, value));
    } else {
      // Array of [key, value] pairs
      entries.forEach(([key, value]) => this.set(key, value));
    }
  }

  /** Returns true if the key is in the map. */
  has(key: string): boolean {
    return key in this._map;
  }

  /** Returns the value associated with the key, or undefined if there is none. */
  get(key: string): V | undefined {
    return this._map[key];
  }

  /** Sets the value for the key in the Map object. */
  set(key: string, value: V): void {
    if (!this.has(key)) {
      this._size++;
    }
    this._map[key] = value;
  }

  /** Removes the specified element from the Map object. */
  delete(key: string): void {
    if (this.has(key)) {
      delete this._map[key];
      this._size--;
    }
  }

  /** Removes all elements from the Map object. */
  clear(): void {
    this._map = {};
    this._size = 0;
  }

  /** Returns the number of elements in the Map object. */
  get size(): number {
    return this._size;
  }

  /** Returns an array of all the keys in the Map. */
  keys(): string[] {
    return Object.keys(this._map);
  }

  /** Returns an array of all the values in the Map. */
  values(): V[] {
    return Object.values(this._map);
  }

  /** Returns an array of all the [key, value] pairs in the Map. */
  entries(): [string, V][] {
    return Object.entries(this._map);
  }

  /** Executes a provided function once per each key/value pair in the Map. */
  forEach(callback: (value: V, key: string) => void): void {
    this.entries().forEach(([key, value]) => callback(value, key));
  }
}
