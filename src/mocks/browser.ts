import 'core-js/features/weak-map';
import { setupWorker } from 'msw/browser';

import handlers from './handlers';

export const startWorker = () => {
  const worker = setupWorker(...handlers);

  return worker.start({
    onUnhandledRequest: 'bypass',
  });
};
