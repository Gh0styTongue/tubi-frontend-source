import {
  formatSamsungUrl,
} from '@adrise/player';
import type { Location } from 'history';
import { useCallback } from 'react';
import { useIntl } from 'react-intl';

import { prepareSubtitleUrls } from 'common/features/playback/components/VideoPlayer/utils/prepareSubtitleUrls';
import { useCaptionSettings } from 'common/features/playback/hooks/useCaptionSettings';
import type { Video } from 'common/types/video';
import { getCaptionStyles, getDefaultCaptionsFromStorage, internationalizeSubtitleLabels, languageCodeMapping } from 'common/utils/captionTools';
import { getSubtitleLanguageFromLocation } from 'web/features/deepLinkActions/utils';

interface UseGetCaptionsConfigProps {
  data: Video;
  /**
   * Location is passed as a prop since getCaptionsConfig can be used
   * outside the context of the router when in-app pip is enabled on web
   */
  location: Location | undefined;
}

export type GetCaptionsConfigFn = (isCaptionDisabled: string | number | boolean) => ReturnType<ReturnType<typeof useGetCaptionsConfig>['getCaptionsConfig']>;

export const useGetCaptionsConfig = ({
  data,
  location,
}: UseGetCaptionsConfigProps) => {
  const intl = useIntl();
  const captionSettings = useCaptionSettings();

  return {
    getCaptionsConfig: useCallback((isCaptionDisabled: string | number| boolean) => {
      if (isCaptionDisabled) {
        return {
          subtitles: [],
        };
      }

      const { subtitles: rawSubtitles = [] } = data;
      let subtitles = prepareSubtitleUrls(rawSubtitles);

      if (__OTTPLATFORM__ === 'TIZEN') {
        subtitles = subtitles.map(subtitle => ({
          ...subtitle,
          url: formatSamsungUrl(subtitle.url),
        }));
      }
      const defaultCaptions = getDefaultCaptionsFromStorage();

      // Check for deep link subtitle action and use it as override
      const deepLinkLanguage = getSubtitleLanguageFromLocation(location);

      // Use deep link language if available, otherwise fall back to user's default
      const defaultCaptionsLanguage = defaultCaptions.enabled ? defaultCaptions.language : 'Off';
      const effectiveDefaultCaptions = deepLinkLanguage && languageCodeMapping[deepLinkLanguage] || defaultCaptionsLanguage;

      const captionStyles = getCaptionStyles(captionSettings);
      return {
        captionsStyles: captionStyles,
        defaultCaptions: effectiveDefaultCaptions,
        subtitles: internationalizeSubtitleLabels(subtitles, intl),
      };
    }, [captionSettings, data, intl, location]),
  };
};

