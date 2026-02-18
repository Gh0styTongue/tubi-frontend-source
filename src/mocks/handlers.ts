import { delay, http, HttpResponse } from 'msw';

import config from './config';
import type { ConfigItem } from './types';

const timeoutHandler = (item: ConfigItem) => {
  const { method = 'get', url, response = {} } = item;
  const { status = 504 } = response;

  return http[method](url, async () => {
    await delay(30_000);
    return HttpResponse.json({}, { status });
  });
};

const handlers = config.map((item) => {
  const { method = 'get', url, response = {} } = item;
  const { payload = {}, status = 200, timeout = 0 } = response;

  if (timeout === true) {
    return timeoutHandler(item);
  }

  return http[method](url, async () => {
    await delay(timeout);
    return HttpResponse.json(payload, { status });
  });
});

export default handlers;
