import { http, HttpResponse } from 'msw';

import getConfig from 'common/apiConfig';

const config = getConfig();
const { uapi } = config;

const TIMEOUT_MS = 30_000;

export const handlers = [
  http.get(uapi.emailAvailable, async () => {
    await new Promise((resolve) => setTimeout(resolve, TIMEOUT_MS));
    return HttpResponse.json({});
  }),
];
