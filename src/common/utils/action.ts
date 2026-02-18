import type { Action } from 'redux';

/**
 * wrap an action
 * @example
 *  actionCreator(actions.LOAD_VIDEO, { result, id: contentId })
 *  will return:
 *  { type, result: result, id: contentId }
 * @param type
 * @param data
 * @returns {object}
 */
export function actionWrapper<T extends string, D extends Record<string, unknown>>(type: T, data: D): Action<T> & Omit<D, 'type'>;
export function actionWrapper<T extends string, D extends { type: unknown }>(type: T, data?: D): never;
export function actionWrapper<T extends string>(type: T): Action<T>;
export function actionWrapper<T extends string, D extends Record<string, unknown>>(type: T, data?: D): Action<T> | Action<T> & Omit<D, 'type'> {
  return {
    ...data,
    type,
  };
}
