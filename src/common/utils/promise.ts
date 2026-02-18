import type { MaybeUndefined } from '@tubitv/ott-ui';

/**
 * Sometimes we want a dispatched action to Promise.resolve() no matter what.
 * This returns a promise that resolves no matter the result of the passed in promise. (loadQueue in App.js for example).
 * @param promise - promise you want to execute
 */
export const alwaysResolve = <T>(promise: Promise<T>): Promise<T extends void ? void : MaybeUndefined<T>> =>
  promise.catch((err) => Promise.resolve(err));

export const promiseTimeout = <T>(promise: Promise<T>, timeout: number) => {
  let timerId: number | NodeJS.Timeout;
  return Promise.race([
    new Promise<T>((resolve, reject) => {
      timerId = setTimeout(() => {
        reject(new Error('timeout'));
      }, timeout);
    }),
    promise,
  ]).finally(() => {
    clearTimeout(timerId);
  });
};

// Onetrust SDK contains a Promise polyfill that doesn't have a `finally` method.
// We have to manually patch it after load onetrust script.
export const patchPromiseFinally = () => {
  // The script is from https://stackoverflow.com/a/53327815
  // eslint-disable-next-line no-extend-native
  Promise.prototype.finally = Promise.prototype.finally || {
    finally(fn: VoidFunction): Promise<unknown> {
      const onFinally = (callback: VoidFunction) => Promise.resolve(fn()).then(callback);
      // @ts-expect-error - TS doesn't know about the then method
      return this.then(
        (result: unknown) => onFinally(() => result),
        (reason: unknown) => onFinally(() => Promise.reject(reason))
      );
    },
  }.finally;
};
