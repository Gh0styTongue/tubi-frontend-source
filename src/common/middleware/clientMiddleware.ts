import type { Middleware } from 'redux';

import type ApiClient from 'common/helpers/ApiClient';
import logger from 'common/helpers/logging';

// TODO @chun Replace it with refetch middleware
export default function clientMiddleware(client: ApiClient): Middleware {
  return ({ dispatch, getState }) =>
    (next) => {
      return (action) => {
        if (typeof action === 'function') {
          return action(dispatch, getState);
        }

        const { promise, types, ...rest } = action;
        if (!promise) {
          return next(action);
        }

        const [REQUEST, SUCCESS, FAILURE] = types;

        next({ ...rest, type: REQUEST });

        return promise(client)
          .then(
            (result: unknown) => {
              next({ ...rest, result, type: SUCCESS });
            },
            (error: Error) => next({ ...rest, error, type: FAILURE })
          )
          .catch((error: Error) => {
            logger.error(error, 'MIDDLEWARE ERROR');
            next({ ...rest, error, type: FAILURE });
          });
      };
    };
}
