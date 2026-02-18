import type { LoadThumbnailSpritesData } from 'common/api/content';
import { makeLoadThumbnailSpritesRequest } from 'common/api/content';
import { THUMBNAIL_TEMPORAL_RESOLUTIONS } from 'common/constants/constants';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type { ThumbnailSprites, ThumbnailSpritesBase, ThumbnailSpritesKeys } from 'common/types/video';
import { getPlatform } from 'common/utils/platform';
import { convertToHttps } from 'common/utils/transformContent';

const platform = getPlatform();

interface FetchContentThumbnailSpritesParams {
  contentId: string;
  type: ThumbnailSpritesKeys;
  dispatch: TubiThunkDispatch;
  deviceId: string;
}

/**
 * Makes a single request to fetch a thumbnail sprite type
 */
const fetchContentThumbnailSprites = async ({ contentId, type, dispatch, deviceId }: FetchContentThumbnailSpritesParams) => {
  const requestOptions: LoadThumbnailSpritesData = {
    platform,
    app_id: 'tubitv',
    page_enabled: false,
    device_id: deviceId,
    type,
    contentId,
  };
  const result = await makeLoadThumbnailSpritesRequest(dispatch, requestOptions);
  return convertToHttps(result) as ThumbnailSpritesBase;
};

interface FetchAllContentThumbnailSpritesParams {
  contentId: string;
  dispatch: TubiThunkDispatch;
  deviceId: string;
}
/**
 * Makes several requests to fetch all thumbnail sprite types
 */
export const fetchAllContentThumbnailSpriteTypes = async ({ contentId, dispatch, deviceId }: FetchAllContentThumbnailSpritesParams) => {
  const results = await Promise.allSettled(THUMBNAIL_TEMPORAL_RESOLUTIONS.map(type => fetchContentThumbnailSprites({ contentId, type, dispatch, deviceId })));

  // Handle each request result and return the results as a ThumbnailSprites object
  // If all requests fail, throw an error
  const formattedResults = results.reduce((acc, result) => {
    if (result.status === 'fulfilled') {
      acc[result.value.type] = result.value;
    }
    return acc;
  }, {} as ThumbnailSprites);

  if (Object.keys(formattedResults).length === 0) {
    throw new Error('No thumbnail sprite types found');
  }

  // @todo-liam Update this so WEB can instead request 5x directly
  // if platform is WEB and 5x is not found, throw an error
  if (platform === 'web' && !formattedResults['5x']) {
    throw new Error('5x thumbnail sprite type is required for WEB platform');
  }

  return formattedResults;
};
