import isbot from 'isbot';

import { isInSuitest } from 'client/setup/tasks/setupSuitest';

export function isCrawler() {
  return !isInSuitest() && isbot(navigator.userAgent);
}
