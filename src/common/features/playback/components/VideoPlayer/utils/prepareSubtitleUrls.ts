import type { Subtitle } from '@adrise/player';

import { toRelativeProtocol } from 'common/utils/urlManipulation';

export function prepareSubtitleUrls(rawSubtitles: Subtitle[]) {
  return rawSubtitles.map(subtitle => ({
    ...subtitle,
    url: `${toRelativeProtocol(subtitle.url.replace(/.vtt/, '.srt'))}`,
  }));
}
