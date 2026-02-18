import { findIndex } from './collection';

/**
 * Find the first container returned from UAPI that is present and has children
 * @param {array} containerIds - container ids
 * @param {object} childrenMap - {container ids: contents (array)}
 */
export function getFirstValidContainer(containerIds: string[], childrenMap: { [container: string]: string[] }) {
  return containerIds[findIndex(containerIds, ((id) => childrenMap[id] && childrenMap[id].length > 0))];
}

type ReducerFunctionType<T, U> = (state?: T, action?: U) => T;

export function createFilteredReducer<T, U>(
  reducerFunction: ReducerFunctionType<T, U>,
  reducerPredicate: (action?: U, state?: T) => boolean,
): ReducerFunctionType<T, U> {
  return (state, action) => {
    const isInitializationCall = state === undefined;
    const shouldRunWrappedReducer = reducerPredicate(action, state) || isInitializationCall;
    return shouldRunWrappedReducer ? reducerFunction(state, action) : (state as T);
  };
}

export function createCompositeReducer<T, U>(...reducers: (ReducerFunctionType<T, U>)[]): ReducerFunctionType<T, U> {
  return (state, action) => {
    return reducers.reduce((prevState, reducer) => reducer(prevState, action), state as T);
  };
}
