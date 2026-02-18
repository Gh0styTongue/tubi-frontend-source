import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { captionSettingsSelector } from 'common/features/playback/selectors/captionSettings';
import useAppSelector from 'common/hooks/useAppSelector';
import { computeWebCaptionStyles } from 'common/utils/captionTools';

import styles from './SubtitlePreview.scss';

const messages = defineMessages({
  sampleText: {
    id: 'web.features.playback.components.PlayerShared.SubtitlePreview.sampleText',
    description: 'sample subtitle text for preview',
    defaultMessage: 'This is how your subtitles will look',
  },
});

export const SubtitlePreview: React.FC = () => {
  const intl = useIntl();
  const captionSettings = useAppSelector(captionSettingsSelector);

  // Compute caption styles with preview mode enabled (smaller font size)
  const captionStyle = computeWebCaptionStyles(captionSettings, true, 2);

  return (
    <div className={styles.subtitleArea}>
      <div className={styles.subtitleWindow} style={captionStyle.window}>
        <span style={captionStyle.font}>
          {intl.formatMessage(messages.sampleText)}
        </span>
      </div>
    </div>
  );
};
