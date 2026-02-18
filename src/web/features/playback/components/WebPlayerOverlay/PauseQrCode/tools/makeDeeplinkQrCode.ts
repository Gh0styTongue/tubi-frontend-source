import QRCode from 'qrcode';

import { BRANCH_IO_KEY, BRANCH_SHORT_LINK_ENDPOINT } from 'common/constants/constants';
import type { Video } from 'common/types/video';
import type { BuildDeeplinkPathParams } from 'common/utils/urlConstruction';
import { buildDeeplinkPath, getActionAndContentTypeForVideo, getUrlByVideo } from 'common/utils/urlConstruction';

/**
 * Caller is expected to handle failure
 */
const getShortDeeplinkUrl = async ({ deviceId, video }: MakeDeeplinkQrCodeParams): Promise<string> => {
  const { action, contentType } = getActionAndContentTypeForVideo(video);

  // for series, we should link to the series page, not the episode
  const contentId = contentType === 'series' && video.series_id ? video.series_id : video.id;

  const deeplinkPathParams: BuildDeeplinkPathParams = {
    action,
    contentType,
    contentId,
    campaign: 'download_app_with_qr',
    medium: 'banner',
    source: 'web',
    deviceId,
  };

  const response = await fetch(BRANCH_SHORT_LINK_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'accept': 'application/json',
    },
    body: JSON.stringify({
      branch_key: BRANCH_IO_KEY,
      channel: 'web',
      feature: 'banner',
      data: {
        deviceId,
        $desktop_url: getUrlByVideo({ video, absolute: true }),
        $android_deeplink_path: buildDeeplinkPath(deeplinkPathParams),
        $deeplink_path: buildDeeplinkPath(deeplinkPathParams),
      },
    }),
  });

  /**
     * Note that the API we call above has rate limits in place. At the scale the
     * web desktop app is used as of this commit, we should be well below the rate
     * limit.
     *
     * @link https://help.branch.io/developers-hub/reference/deep-linking-api#section-link-create
     */
  if (!response.ok) {
    throw new Error(`Failed to get short deeplink URL with status ${response.status}`);
  }
  return (await response.json()).url;
};

const makeQrCode = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    QRCode.toDataURL(
      url,
      {
        color: {
          // The last 2 digits are the alpha channel. We need to pass 00 for
          // the alpha channel to make the resulting encoded PNG suitable
          // for use as a mask via the mask-image CSS property.
          dark: '#00000000',
        },
      },
      (error, dataURL) => {
        if (error) {
          reject(error);
        } else {
          resolve(dataURL);
        }
      }
    );
  });
};

export interface MakeDeeplinkQrCodeParams {
  deviceId: string | undefined;
  video: Video
}

/**
 * Wrapper around the async functions above. Caller is expected to handle failure
 */
export const makeDeeplinkQrCode = async ({ deviceId, video }: MakeDeeplinkQrCodeParams): Promise<string> => {
  const deeplinkUrl = await getShortDeeplinkUrl({ deviceId, video });
  return makeQrCode(deeplinkUrl);
};
