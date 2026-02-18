import Analytics from '@tubitv/analytics';

import systemApi from 'client/systemApi';
import type { GetOTTAdUrlOptions } from 'common/features/playback/utils/getAdQueryObject';
import { getAdQueryObject } from 'common/features/playback/utils/getAdQueryObject';

export const getOTTAdQueryObject = ({
  advertiserId = systemApi.getAdvertiserId(),
  advertiserOptOut = systemApi.getAdvertiserOptOut && systemApi.getAdvertiserOptOut(),
  advertiserUSPrivacy = systemApi.getAdvertiserUSPrivacy && systemApi.getAdvertiserUSPrivacy(),
  zipcode = systemApi.getZipcode(),
  useIPv4OnlyServer,
  ...restOptions
}: GetOTTAdUrlOptions) => {
  // todo(benji): once we remove this block of side effect, we can safely clean up this function, and replace "getOTTAdUrl" by "getAdUrl".
  /* istanbul ignore next */
  if (advertiserId) {
    Analytics.mergeConfig(() => ({ advertiser_id: advertiserId }));
  }

  return getAdQueryObject({
    advertiserId,
    advertiserOptOut,
    advertiserUSPrivacy,
    zipcode,
    ...(__OTTPLATFORM__ === 'TIVO' && { mvpd: systemApi.getMvpd() }),
    ...(__OTTPLATFORM__ === 'TIVO' && { tivo_platform: systemApi.getTivoPlatform() }),
    ...(__OTTPLATFORM__ === 'COMCAST' && {
      adAttributes: systemApi.getAdAttributes(),
      partnerId: systemApi.getPartnerId && systemApi.getPartnerId(),
    }),
    ...(__OTTPLATFORM__ === 'HISENSE' && {
      vauth: systemApi.getAdvertiserVauth && systemApi.getAdvertiserVauth(),
    }),
    ...(['PS4', 'PS5'].includes(__OTTPLATFORM__) && {
      adCode: systemApi.getAdvertiserCode && systemApi.getAdvertiserCode(),
    }),
    ...restOptions,
  });
};
