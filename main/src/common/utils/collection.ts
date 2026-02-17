/**
 * find the index of element which satisfy `predicate`
 * @param arr
 * @param {function} predicate, will be passed the item
 * @returns {number}
 */
export function findIndex<T>(list: T[], predicate: (v: T) => boolean, startIndex: number = 0): number {
  let idx = -1;

  for (let i = startIndex; i < list.length; i++) {
    const item = list[i];

    if (predicate(item)) {
      idx = i;
      break;
    }
  }

  return idx;
}

/**
 * dedupe a simple array
 * @param {array} array
 * @returns {array} returns a new array with duplicates removed
 */
export const dedupSimpleArray = (array: string[]) => {
  const valuesMap: Record<string, boolean> = {};
  const dedupedArray: string[] = [];
  array.forEach((value) => {
    if (!valuesMap[value]) {
      valuesMap[value] = true;
      dedupedArray.push(value);
    }
  });
  return dedupedArray;
};

// returns true if at least one value in obj is not an empty string, or false if all values are empty
export const checkIfKeysExist = (obj: object) => {
  for (const key in obj) {
    /* istanbul ignore else */
    if (obj[key] !== '') {
      return true;
    }
  }
  return false;
};

// returns true if at least one value in obj is an empty string, or false if all key are set
export const hasEmptyStringValue = (obj: object) => {
  for (const key in obj) {
    /* istanbul ignore else */
    if (obj[key] === '') {
      return true;
    }
  }
  return false;
};
