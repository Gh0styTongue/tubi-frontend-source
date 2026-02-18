import { AdapterTypes } from '@adrise/player';

import type { AdapterType } from '../hooks/useBuildPlayer';

export const loadCustomAdapter = async (adapterType: AdapterTypes): Promise<AdapterType | undefined> => {
  switch (adapterType) {
    case AdapterTypes.WEB: {
      const { default: adapter } = await import(/* webpackChunkName: "web-adapter" */'@adrise/player/lib/adapters/web');
      const Adapter = adapter;
      return Adapter;
    }
    case AdapterTypes.SAMSUNG: {
      const { default: adapter } = await import(/* webpackChunkName: "samsung-adapter" */'@adrise/player/lib/adapters/samsung');
      const Adapter = adapter;
      return Adapter;
    }
    case AdapterTypes.HTML5: {
      const { default: adapter } = await import(/* webpackChunkName: "html5-adapter" */'@adrise/player/lib/adapters/html5');
      const Adapter = adapter;
      return Adapter;
    }
    default: {
      break;
    }
  }
};
