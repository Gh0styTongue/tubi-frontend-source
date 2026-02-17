import type { ConfigItem } from './types';

let config: ConfigItem[] = [];

if (__IS_MOCKING_ENABLED__) {
  config = require('./config.local').default;
}

export default config;
