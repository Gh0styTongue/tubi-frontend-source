import type { Subtitle, Captions } from '@adrise/player';
import classnames from 'classnames';
import type { FC } from 'react';
import React from 'react';
import { defineMessages } from 'react-intl';

import type { AudioTrackMetadata } from 'common/types/video';
import { getInternationalizedLanguage, isValidSubtitleLang } from 'common/utils/captionTools';
import { useIntl } from 'i18n/intl';

import styles from './AudioLanguagesAndSubtitles.scss';

const messages = defineMessages({
  audioLanguages: {
    description: 'audio languages list label',
    defaultMessage: 'Audio Languages',
  },
  subtitles: {
    description: 'subtitles list label',
    defaultMessage: 'Subtitles',
  },
  audioDescriptionLabel: {
    description: 'audio description label',
    defaultMessage: 'Audio Description',
  },
});

interface AudioLanguagesAndSubtitlesProps {
  subtitles?: Subtitle[];
  audioTracks?: AudioTrackMetadata[];
  className?: string;
}

const AudioLanguagesAndSubtitles: FC<AudioLanguagesAndSubtitlesProps> = ({ subtitles = [], audioTracks = [], className }) => {
  const intl = useIntl();

  const parseAudioTrackLabels = (tracks: AudioTrackMetadata[]): string => {
    return tracks
      .map((track) => track.display_name)
      .join(', ');
  };

  const parseSubtitleLanguages = (subtitleLanguages: Subtitle[]): string => {
    const captions: Captions[] = subtitleLanguages.map(subtitleLanguage => ({
      id: subtitleLanguage.lang,
      lang: subtitleLanguage.lang,
      label: subtitleLanguage.lang,
    }));
    return captions.reduce((acc: string[], subtitleLanguage) => {
      if (subtitleLanguage.label !== 'Off' && subtitleLanguage.lang && isValidSubtitleLang(subtitleLanguage.lang)) {
        const internationalizedLabel = getInternationalizedLanguage(subtitleLanguage.lang);
        acc.push(internationalizedLabel);
      }
      return acc;
    }, []).join(', ');
  };

  return (
    <div className={classnames(styles.audioLanguagesAndSubtitles, className)}>
      {audioTracks?.length ? (
        <div className={styles.line}>
          {/* eslint-disable-next-line react/jsx-no-literals -- no i18n needed for punctuation */}
          <div><span className={styles.label}>{intl.formatMessage(messages.audioLanguages)}: </span> {parseAudioTrackLabels(audioTracks)}</div>
        </div>
      ) : null}
      {subtitles?.length ? (
        <div className={styles.line}>
          {/* eslint-disable-next-line react/jsx-no-literals -- no i18n needed for punctuation */}
          <div><span className={styles.label}>{intl.formatMessage(messages.subtitles)}: </span> {parseSubtitleLanguages(subtitles)}</div>
        </div>
      ) : null}
    </div>
  );
};

export default AudioLanguagesAndSubtitles;
