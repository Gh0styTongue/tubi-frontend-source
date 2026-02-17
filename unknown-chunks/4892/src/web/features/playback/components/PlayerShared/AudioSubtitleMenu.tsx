import type { AudioTrackInfo } from '@adrise/player';
import { Settings, Close } from '@tubitv/icons';
import { IconButton, OptionList } from '@tubitv/web-ui';
import type { ListOption } from '@tubitv/web-ui';
import classNames from 'classnames';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import IconTextButton from 'common/components/uilib/IconTextButton/IconTextButton';
import { WEB_ROUTES } from 'common/constants/routes';
import { getA11yAudioTrackLabel, audioLabelMapping, getLanguageCodeFromAudioTrack, isDescriptionTrack } from 'common/utils/audioTracks';

import type { AudioSubtitleControlsProps } from './AudioSubtitleControls';
import styles from './AudioSubtitleControls.scss';

const messages = defineMessages({
  cc: {
    description: 'closed captioning icon label text',
    defaultMessage: 'Subtitles',
  },
  fontSize: {
    description: 'font size label text',
    defaultMessage: 'Font Size',
  },
  background: {
    description: 'background for closed captions label text',
    defaultMessage: 'Background',
  },
  settings: {
    description: 'advanced settings for closed captions label text',
    defaultMessage: 'Advanced Settings',
  },
  audioTracks: {
    description: 'audio tracks',
    defaultMessage: 'Audio',
  },
});

const LANGUAGE_MENU_ID = 'captionsList';

export interface AudioSubtitleMenuProps extends AudioSubtitleControlsProps {
  handleCaptionLanguageChange: (index: number) => void;
}

const AudioSubtitleMenu: React.FC<AudioSubtitleMenuProps> = (props: AudioSubtitleMenuProps) => {
  const {
    captionsList,
    captionsIndex,
    getAudioTracks,
    getCurrentAudioTrack,
    setAudioTrack,
    forceFullHeightMenu,
    getMenuContainer,
    handleAdvancedSettingsClick,
    handleCaptionLanguageChange,
    playerView,
    isCasting,
    onToggle,
  } = props;

  const stopPropagation = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const listRef = useRef<HTMLDivElement>(null);

  const [forceFullHeight, setForceFullHeight] = useState(forceFullHeightMenu);

  const [audioTracks, setAudioTracks] = useState<AudioTrackInfo[]>([]);

  const [currentAudioTrack, setCurrentAudioTrack] = useState<AudioTrackInfo | undefined>(undefined);

  const unifyAudioTrackLabel = useCallback((audioTrack: AudioTrackInfo) => {
    const labelType = isDescriptionTrack(audioTrack) ? 'description' : 'main';
    const language = getLanguageCodeFromAudioTrack(audioTrack);
    const label = audioLabelMapping[language]?.[labelType] || audioTrack.role || `Unknown ${language}`;

    return { label };
  }, []);

  const audioTrackOptions = useMemo(() => audioTracks
    .filter(a => a.language)
    .map<ListOption>(unifyAudioTrackLabel),
  [audioTracks, unifyAudioTrackLabel]);

  useEffect(() => {
    const audioTracks = getAudioTracks?.() || [];
    const currentAudioTrack = getCurrentAudioTrack?.();

    setAudioTracks(audioTracks);
    setCurrentAudioTrack(currentAudioTrack);
  }, [getAudioTracks, getCurrentAudioTrack]);

  useLayoutEffect(() => {
    const menuHeight = listRef.current?.offsetHeight ?? 0;
    const containerHeight = getMenuContainer()?.offsetHeight ?? 0;
    if (!isCasting && !forceFullHeight && menuHeight > containerHeight) {
      setForceFullHeight(true);
    }
  }, [forceFullHeight, getMenuContainer, playerView, isCasting]);

  useLayoutEffect(() => {
    if (!forceFullHeight) return;
    const menuContainer = getMenuContainer();
    if (!menuContainer) return () => {};
    const parentNode = listRef.current?.parentNode;
    const menuNode = listRef.current ? menuContainer.appendChild(listRef.current) : null;
    return () => {
      // move it back where it was, just in case
      if (menuNode) {
        parentNode?.appendChild(menuNode);
      }
    };
  }, [getMenuContainer, forceFullHeight]);

  const onCloseMenu = () => {
    onToggle?.(false);
  };

  const classes = classNames(styles.captionsList, forceFullHeight ? styles.fullHeight : null);

  const onAudioTrackSelect = useCallback(async (idx: number) => {
    const currentAudioTrack = await setAudioTrack?.(audioTracks[idx].id);
    setCurrentAudioTrack(currentAudioTrack);
  }, [setAudioTrack, audioTracks]);

  if (captionsList.length <= 1 && (!audioTracks || audioTracks.length <= 0)) return null;

  const activeAudioTrackLabel = currentAudioTrack ? getA11yAudioTrackLabel(currentAudioTrack) : '';

  return (
    <div
      id={LANGUAGE_MENU_ID}
      data-test-id="features-playback-closed-captions-menu"
      onClick={stopPropagation}
      className={classes}
      ref={listRef}
    >
      {forceFullHeight ? (
        <IconButton
          className={styles.closeButton}
          icon={<Close />}
          onClick={onCloseMenu}
        />
      ) : null}
      <div className={styles.options}>
        <section>
          <h3><FormattedMessage {...messages.cc} /></h3>
          <OptionList
            options={captionsList}
            activeLabel={captionsList[captionsIndex]?.label}
            onOptionSelect={handleCaptionLanguageChange}
          />
        </section>

        { audioTracks.length > 1
          ? (
            <div>
              <section>
                <h3><FormattedMessage {...messages.audioTracks} /></h3>
                <OptionList
                  options={audioTrackOptions}
                  activeLabel={activeAudioTrackLabel}
                  onOptionSelect={onAudioTrackSelect}
                />
              </section>
            </div>
          ) : null }
      </div>
      <div className={styles.menuFooter}>
        <IconTextButton
          className={styles.advancedSettingsLink}
          // Since this is an internal link, only use target="_blank" in a
          // tabbed browser environment
          targetBlank={__WEBPLATFORM__ === 'WEB'}
          text=""
          to={WEB_ROUTES.customCaptions}
          onClick={handleAdvancedSettingsClick}
          data-test-id="advancedCaptionSettingsButton"
        >
          <Settings />
          <FormattedMessage {...messages.settings} />
        </IconTextButton>
      </div>
    </div>
  );
};

export default AudioSubtitleMenu;
