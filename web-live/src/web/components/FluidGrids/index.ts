import LiveNewsTile from 'web/components/LiveNewsTile/LiveNewsTile';
import ShortFormTile from 'web/components/ShortFormTile/ShortFormTile';

import getFluidGrid from './getFluidGrid';

export const ShortFormFluidGrid = getFluidGrid(ShortFormTile);
export const LiveNewsFluidGrid = getFluidGrid(LiveNewsTile);
