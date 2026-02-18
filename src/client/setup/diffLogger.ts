/* eslint-disable no-console -- dev only, for debugging purposes */
import type { Diff } from 'deep-diff';

type UnknownDiff = Diff<unknown, unknown>;

const getDiffArgs = (diff: UnknownDiff): Parameters<typeof console.log> => {
  const path = (diff.path ?? []).join('.');

  switch (diff.kind) {
    case 'E':
      return ['CHANGED:', path, diff.lhs, '→', diff.rhs];
    case 'N':
      return ['ADDED:', path, diff.rhs];
    case 'D':
      return ['DELETED:', path];
    case 'A':
      return [`ARRAY ${path}[${diff.index}]:`, ...getDiffArgs(diff.item)];
    /* istanbul ignore next */
    default:
      throw new Error(`unexpected kind: ${(diff as UnknownDiff).kind}`);
  }
};

const diffLogger = (diffs: UnknownDiff[] | undefined) => {
  try {
    // eslint-disable-next-line compat/compat -- fallback provided
    console.groupCollapsed('diff');
  } catch (e) {
    console.log('diff');
  }

  if (diffs) {
    diffs.forEach(diff => {
      console.log(...getDiffArgs(diff));
    });
  } else {
    console.log('-- no diff --');
  }

  try {
    // eslint-disable-next-line compat/compat -- fallback provided
    console.groupEnd();
  } catch (e) {
    console.log('-- diff end -- ');
  }
};

export default diffLogger;
