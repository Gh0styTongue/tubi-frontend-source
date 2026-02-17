import type { AudioTrackInfo, Captions } from '@adrise/player';
import type { controlActions } from '@adrise/player/lib/action';
import { Subtitles } from '@tubitv/icons';
import { IconButton } from '@tubitv/web-ui';
import classNames from 'classnames';
import React, { useCallback, useEffect, useRef } from 'react';

import { webKeys } from 'common/constants/key-map';
import { addEventListener, removeEventListener } from 'common/utils/dom';

import styles from './AudioSubtitleControls.scss';
import AudioSubtitleMenu from './AudioSubtitleMenu';
import type { WebPlayerViewMode } from '../WebLivePlayer/WebLivePlayer';

const LANGUAGE_CONTROL_ID = 'languageArea';

export interface AudioSubtitleControlsProps {
  isAd: boolean;
  captionsList: Captions[];
  captionsIndex: number;
  className?: string;
  getMenuContainer(): HTMLDivElement | null;
  handleAdvancedSettingsClick?: () => void;
  iconClass?: string;
  setCaptions: typeof controlActions['setCaptions'] | ((index: number) => void) ;
  toggleDelay: number;
  forceFullHeightMenu?: boolean;
  onToggle?: (visible: boolean) => void;
  visible?: boolean;
  getAudioTracks?: () => AudioTrackInfo[] | undefined;
  getCurrentAudioTrack?: () => AudioTrackInfo | undefined;
  setAudioTrack?: (idx: number) => Promise<AudioTrackInfo>;
  hideAdvancedSettings?: boolean;
  isCasting?: boolean;
  isFullscreen?: boolean;
  playerView?: WebPlayerViewMode;
  basicCaptionSettings?: unknown;
}

interface CCTimers {
  showCaptionsList?: number;
  hideCaptionsList?: number;
}

const AudioSubtitleControls: React.FC<AudioSubtitleControlsProps> = (props: AudioSubtitleControlsProps) => {
  const {
    captionsIndex,
    captionsList,
    className,
    iconClass,
    isAd,
    setCaptions,
    toggleDelay,
    onToggle,
    visible,
    forceFullHeightMenu,
    playerView,
    isCasting,
  } = props;
  const timersRef = useRef<CCTimers>({});
  const closedCaptionsRef = useRef<HTMLDivElement>(null);
  const isLive = typeof playerView !== 'undefined';
  const isVOD = !isLive && !isCasting;
  const enableMouseMoveAction = isVOD && forceFullHeightMenu;

  const showCaptionsList = useCallback(() => {
    window.clearTimeout(timersRef.current?.hideCaptionsList);
    timersRef.current.showCaptionsList = window.setTimeout(() => {
      if (!visible) {
        onToggle?.(true);
      }
    }, toggleDelay);
  }, [visible, toggleDelay, onToggle]);

  const hideCaptionsList = useCallback(() => {
    window.clearTimeout(timersRef.current?.showCaptionsList);
    timersRef.current.hideCaptionsList = window.setTimeout(() => {
      if (visible) {
        onToggle?.(false);
      }
    }, toggleDelay);
  }, [visible, onToggle, toggleDelay]);

  const handleCaptionLanguageChange = useCallback((idx: number) => {
    setCaptions(idx !== captionsIndex ? idx : 0);
  }, [captionsIndex, setCaptions]);

  const handleClickCaptionsIcon = useCallback((isFromEnter:boolean, e: React.MouseEvent|React.KeyboardEvent) => {
    e.stopPropagation();
    // if no forceFullHeightMenu, it will show captions while hovering
    // else should toggle show/hide captionsList
    if (forceFullHeightMenu || isFromEnter) {
      if (!visible) {
        showCaptionsList();
      } else {
        hideCaptionsList();
      }
    }
  }, [
    visible, showCaptionsList, hideCaptionsList, forceFullHeightMenu,
  ]);

  // cleanup any unresolved timers on unmount
  useEffect(() => () => {
    window.clearTimeout(timersRef.current?.hideCaptionsList);
    window.clearTimeout(timersRef.current?.showCaptionsList);
  }, []);

  const handleOutsideClickOrTabEvent = useCallback((event: MouseEvent | KeyboardEvent) => {
    if (visible
      && (event instanceof MouseEvent
      || (event instanceof KeyboardEvent && event.keyCode === webKeys.tab && event.target instanceof HTMLElement && !closedCaptionsRef.current?.contains(event.target))
      || (event instanceof KeyboardEvent && event.keyCode === webKeys.escape))
    ) {
      /* istanbul ignore next: ignore optional chaining */
      onToggle?.(false);
    }
  }, [visible, onToggle]);

  useEffect(() => {
    addEventListener(window, 'keyup', handleOutsideClickOrTabEvent);
    if (forceFullHeightMenu) {
      addEventListener(window, 'click', handleOutsideClickOrTabEvent);
    }
    return () => {
      removeEventListener(window, 'click', handleOutsideClickOrTabEvent);
      removeEventListener(window, 'keyup', handleOutsideClickOrTabEvent);
    };
  }, [forceFullHeightMenu, handleOutsideClickOrTabEvent]);

  if (isAd || captionsList.length === 0) {
    return null;
  }
  return (
    <span
      key="language"
      id={LANGUAGE_CONTROL_ID}
      className={classNames(
        className,
        styles.captions,
        {
          [styles.active]: captionsIndex > 0,
        }
      )}
      ref={closedCaptionsRef}
      onMouseEnter={enableMouseMoveAction ? undefined : showCaptionsList}
      onMouseLeave={enableMouseMoveAction ? undefined : hideCaptionsList}
    >
      <IconButton
        data-test-id="ccButton"
        icon={<Subtitles className={iconClass} />}
        onClick={handleClickCaptionsIcon.bind(this, false)}
        onEnter={handleClickCaptionsIcon.bind(this, true)}
        className={styles.cc}
        containerClassName={classNames({ [styles.popupShow]: visible })}
      />
      {visible ? <AudioSubtitleMenu {...props} handleCaptionLanguageChange={handleCaptionLanguageChange} /> : null}
    </span>
  );
};

export default AudioSubtitleControls;
