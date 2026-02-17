import { isKeyInUserAgent } from 'client/utils/clientTools';

import BaseSystemApi from './systemApi';

class WebSystemApi extends BaseSystemApi {
  // Constructor is needed to be able to get 100% coverage.
  /* eslint-disable @typescript-eslint/no-useless-constructor */
  constructor() {
    /* istanbul ignore next */
    super();
  }

  support4KDecode(): Promise<boolean> {
    if (__SERVER__) {
      return Promise.resolve(false);
    }
    return Promise.resolve(isKeyInUserAgent('Safari') && !isKeyInUserAgent('Chrome'));
  }
}

export default WebSystemApi;
