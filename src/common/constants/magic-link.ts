import type { ValueOf } from 'ts-essentials';

export const MAGIC_LINK_STATUS = {
  success: 'success',
  fail: 'fail',
  error: 'error',
} as const;

export type StatusKeys = keyof typeof MAGIC_LINK_STATUS;

export type StatusValues = ValueOf<typeof MAGIC_LINK_STATUS>;
