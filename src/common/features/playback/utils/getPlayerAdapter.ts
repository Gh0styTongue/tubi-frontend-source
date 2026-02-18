import type { Adapter as AdapterType, AdapterConstructor } from '@adrise/player';

import { isSamsungBefore2017 } from 'common/utils/tizenTools';

let Adapter: AdapterType & AdapterConstructor;

export function updateAdapter() {
  if (!__ISOTT__) {
    Adapter = require('@adrise/player/lib/adapters/web').default;
  } else if (__OTTPLATFORM__ === 'TIZEN' && isSamsungBefore2017()) {
    Adapter = require('@adrise/player/lib/adapters/samsung').default;
  } else {
    Adapter = require('@adrise/player/lib/adapters/html5').default;
  }
  return Adapter;
}

updateAdapter();

export function getPlayerHTMLString() {
  return Adapter.htmlString;
}

export function getPlayerAdapter() {
  return Adapter;
}
