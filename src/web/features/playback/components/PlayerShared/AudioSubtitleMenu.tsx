import type { AudioTrackInfo } from '@adrise/player';
import { Settings, Close } from '@tubitv/icons';
import { IconButton, OptionList } from '@tubitv/web-ui';
import type { ListOption } from '@tubitv/web-ui';
import classNames from 'classnames';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import IconTextButton from 'common/components/uilib/IconTextButton/IconTextButton';
import { useExperiment } from 'common/experimentV2';
import { webAdvancedSettingsInPlayer } from 'common/experimentV2/configs/webAdvancedSettingsInPlayer';
import { getA11yAudioTrackLabel, audioLabelMapping, getLanguageCodeFromAudioTrack, isDescriptionTrack } from 'common/utils/audioTracks';

import type { AudioSubtitleControlsProps } from './AudioSubtitleControls';
import styles from './AudioSubtitleControls.scss';
import { MainCaptionMenu } from './AudioSubtitleMenuLayers';
import { AudioSubtitleSettingsDrawer } from './AudioSubtitleSettingsDrawer';

const messages = defineMessages({
  cc: {
    description: 'closed captioning icon label text',
    defaultMessage: 'Closed Captions and Subtitles',
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
  audioSubtitleSettings: {
    id: 'audioSubtitleMenu.audioSubtitleSettings',
    description: 'aria-label for audio and subtitle settings menu',
    defaultMessage: 'Audio and subtitle settings',
  },
  closeAudioSubtitleSettings: {
    id: 'audioSubtitleMenu.closeAudioSubtitleSettings',
    description: 'aria-label for close button in audio and subtitle settings menu',
    defaultMessage: 'Close audio and subtitle settings',
  },
  openAdvancedCaptionSettings: {
    id: 'audioSubtitleMenu.openAdvancedCaptionSettings',
    description: 'aria-label for advanced caption settings button',
    defaultMessage: 'Open advanced caption settings',
  },
  customizeSubtitleAppearance: {
    id: 'audioSubtitleMenu.customizeSubtitleAppearance',
    description: 'subtitle text for advanced caption settings button',
    defaultMessage: 'Customize subtitle appearance',
  },
});

const LANGUAGE_MENU_ID = 'captionsList';
const CAPTIONS_SECTION_ID = 'captions-section';
const AUDIO_SECTION_ID = 'audio-section';

export interface AudioSubtitleMenuProps extends AudioSubtitleControlsProps {
  handleCaptionLanguageChange: (index: number) => void;
  onAdvancedDrawerStateChange?: (isOpen: boolean) => void;
}

const AudioSubtitleMenu: React.FC<AudioSubtitleMenuProps> = (props: AudioSubtitleMenuProps) => {
  const intl = useIntl();
  const experiment = useExperiment(webAdvancedSettingsInPlayer, { disableExposureLog: true });
  const advancedSettingsInPlayer = experiment.get('advanced_settings_in_player');

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
    onAdvancedDrawerStateChange,
  } = props;

  const stopPropagation = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const listRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [forceFullHeight, setForceFullHeight] = useState(forceFullHeightMenu);

  const [audioTracks, setAudioTracks] = useState<AudioTrackInfo[]>([]);

  const [currentAudioTrack, setCurrentAudioTrack] = useState<AudioTrackInfo | undefined>(undefined);

  const [showAdvancedDrawer, setShowAdvancedDrawer] = useState(false);
  const [currentMenu, setCurrentMenu] = useState<React.ReactNode>(null);
  const [currentTitle, setCurrentTitle] = useState<string>('');
  const [openedViaKeyboard, setOpenedViaKeyboard] = useState(false);

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

  const onCloseMenu = useCallback(() => {
    onToggle?.(false);
  }, [onToggle]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onCloseMenu();
    }
  }, [onCloseMenu]);

  // Focus management when menu opens
  useEffect(() => {
    if (menuRef.current) {
      // Focus the first focusable element in the menu (first button with tabindex="0")
      const firstFocusable = menuRef.current.querySelector('button[tabindex="0"]') as HTMLElement;
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }
  }, []);

  const classes = classNames(
    styles.captionsList,
    showAdvancedDrawer ? styles.drawerOpen : null, // Add specific styling when drawer is open
    forceFullHeight ? styles.fullHeight : null
  );

  const onAudioTrackSelect = useCallback(async (idx: number) => {
    const currentAudioTrack = await setAudioTrack?.(audioTracks[idx].id);
    setCurrentAudioTrack(currentAudioTrack);
  }, [setAudioTrack, audioTracks]);

  const handleAdvancedSettingsNavigation = useCallback((viaKeyboard = false) => {
    handleAdvancedSettingsClick?.();

    // Only open the drawer if the experiment is enabled
    if (advancedSettingsInPlayer) {
      setShowAdvancedDrawer(true);
      onAdvancedDrawerStateChange?.(true);
      setCurrentMenu(null); // Reset to main menu
      setOpenedViaKeyboard(viaKeyboard);
    }
    // If experiment is disabled, the hook will handle opening the new tab
  }, [handleAdvancedSettingsClick, onAdvancedDrawerStateChange, advancedSettingsInPlayer]);

  const handleNavigateTo = useCallback((menu: React.ReactNode) => {
    setCurrentMenu(menu);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setShowAdvancedDrawer(false);
    onAdvancedDrawerStateChange?.(false);
    setCurrentMenu(null);
    setCurrentTitle(''); // Reset title when closing drawer
  }, [onAdvancedDrawerStateChange]);

  const handleTitleChange = useCallback((title: string) => {
    setCurrentTitle(title);
  }, []);

  const handleBackToMain = useCallback(() => {
    setCurrentMenu(null); // Reset to main menu
    // The MainCaptionMenu will set its own title when it mounts
  }, []);

  const handleAdvancedSettingsKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleAdvancedSettingsNavigation(true); // Mark as keyboard navigation
    }
  }, [handleAdvancedSettingsNavigation]);

  const handleAdvancedSettingsMouseClick = useCallback(() => {
    handleAdvancedSettingsNavigation(false); // Mark as mouse navigation
  }, [handleAdvancedSettingsNavigation]);

  if (captionsList.length <= 1 && (!audioTracks || audioTracks.length <= 0)) return null;

  const activeAudioTrackLabel = currentAudioTrack ? getA11yAudioTrackLabel(currentAudioTrack) : '';

  return (
    <div
      id={LANGUAGE_MENU_ID}
      data-test-id="features-playback-closed-captions-menu"
      onClick={stopPropagation}
      onKeyDown={handleKeyDown}
      className={classes}
      ref={listRef}
      role="dialog"
      aria-modal="true"
      aria-label={intl.formatMessage(messages.audioSubtitleSettings)}
    >
      {showAdvancedDrawer && advancedSettingsInPlayer ? (
        <AudioSubtitleSettingsDrawer
          isOpen={showAdvancedDrawer}
          onClose={handleCloseDrawer}
          title={currentTitle}
          onBack={currentMenu ? handleBackToMain : undefined}
          showPreview={!!currentMenu}
        >
          {currentMenu || <MainCaptionMenu
            onNavigateTo={handleNavigateTo}
            onClose={handleCloseDrawer}
            onTitleChange={handleTitleChange}
            onBack={handleCloseDrawer}
            openedViaKeyboard={openedViaKeyboard}
          />}
        </AudioSubtitleSettingsDrawer>
      ) : (
        <>
          {forceFullHeight ? (
            <IconButton
              className={styles.closeButton}
              icon={<Close />}
              onClick={onCloseMenu}
              aria-label={intl.formatMessage(messages.closeAudioSubtitleSettings)}
            />
          ) : null}
          <div className={styles.options} ref={menuRef}>
            <section>
              <h3 id={CAPTIONS_SECTION_ID}><FormattedMessage {...messages.cc} /></h3>
              <OptionList
                options={captionsList}
                activeLabel={captionsList[captionsIndex]?.label}
                onOptionSelect={handleCaptionLanguageChange}
                aria-labelledby={CAPTIONS_SECTION_ID}
              />
            </section>

            { audioTracks.length > 1
              ? (
                <div>
                  <section>
                    <h3 id={AUDIO_SECTION_ID}><FormattedMessage {...messages.audioTracks} /></h3>
                    <OptionList
                      options={audioTrackOptions}
                      activeLabel={activeAudioTrackLabel}
                      onOptionSelect={onAudioTrackSelect}
                      aria-labelledby={AUDIO_SECTION_ID}
                    />
                  </section>
                </div>
              ) : null }
          </div>
          <div
            className={styles.menuFooter}
            tabIndex={0}
            onClick={handleAdvancedSettingsMouseClick}
            onKeyDown={handleAdvancedSettingsKeyDown}
            role="button"
            aria-label={intl.formatMessage(messages.openAdvancedCaptionSettings)}
          >
            <IconTextButton
              className={styles.advancedSettingsLink}
              text=""
              onClick={handleAdvancedSettingsMouseClick}
              data-test-id="advancedCaptionSettingsButton"
              aria-hidden="true"
            >
              <Settings />
              <div>
                <FormattedMessage {...messages.settings} />
                <div className={styles.subtitle}>
                  <FormattedMessage {...messages.customizeSubtitleAppearance} />
                </div>
              </div>
            </IconTextButton>
          </div>
        </>
      )}
    </div>
  );
};

export default AudioSubtitleMenu;
