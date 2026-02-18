const scrollMap = new Map<string, number>();

export function getScrollPosition(key: string): number | undefined {
  return scrollMap.get(key);
}

export function setScrollPosition(key: string, value: number): void {
  scrollMap.set(key, value);
}

export function deleteScrollPosition(key: string): void {
  scrollMap.delete(key);
}

export function clearAllScrollPositions(): void {
  scrollMap.clear();
}
