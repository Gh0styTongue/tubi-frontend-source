import type { ConfigItem } from './types';

const config: ConfigItem[] = (() => {
  try {
    return require('./config.local').default;
  } catch {
    return [];
  }
})();

export default config;
