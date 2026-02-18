import { ChevronLeft } from '@tubitv/icons';
import React, { useRef, useEffect, useState, useMemo } from 'react';
import isEqual from 'react-fast-compare';
import { defineMessages, useIntl } from 'react-intl';

import { useGetPlayerInstance } from 'common/features/playback/context/playerContext/hooks/useGetPlayerInstance';
import { captionSettingsSelector } from 'common/features/playback/selectors/captionSettings';
import useAppSelector from 'common/hooks/useAppSelector';
import { captionsIndexSelector, captionsListSelector } from 'common/selectors/playerStore';
import type { WebCaptionSettingsState } from 'common/types/captionSettings';
import { computeWebCaptionStyles } from 'common/utils/captionTools';

import styles from './AudioSubtitleSettingsDrawer.scss';
import { SubtitlePreview } from './SubtitlePreview';

const messages = defineMessages({
  captionSettings: {
    id: 'web.features.playback.components.PlayerShared.AudioSubtitleSettingsDrawer.captionSettings',
    description: 'title for caption settings drawer',
    defaultMessage: 'Caption Settings',
  },
  goBack: {
    id: 'web.features.playback.components.PlayerShared.AudioSubtitleSettingsDrawer.goBack',
    description: 'label for go back button in settings drawer',
    defaultMessage: 'Go Back',
  },
  closeSettings: {
    id: 'web.features.playback.components.PlayerShared.AudioSubtitleSettingsDrawer.closeSettings',
    description: 'label for close settings button in drawer',
    defaultMessage: 'Close Settings',
  },
});

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  onBack?: () => void;
  showPreview: boolean;
}

export const AudioSubtitleSettingsDrawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  children,
  title,
  onBack,
  showPreview,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const intl = useIntl();
  const { getPlayerInstance } = useGetPlayerInstance();
  const captionSettings = useAppSelector(captionSettingsSelector);
  const captionsIndex = useAppSelector(captionsIndexSelector);
  const captionsList = useAppSelector(captionsListSelector);
  const [prevSettings, setPrevSettings] = useState<WebCaptionSettingsState>(captionSettings);

  const isAnyCaptionActive = useMemo(() => {
    return captionsIndex !== 0;
  }, [captionsIndex]);

  const haveCaptionSettingsChanged = useMemo(() => {
    return !isEqual(captionSettings, prevSettings);
  }, [captionSettings, prevSettings]);

  // Update caption settings when changed by menus
  useEffect(() => {
    const player = getPlayerInstance();
    if (player) {
      const newStyles = computeWebCaptionStyles(captionSettings);
      player.setCaptionsStyles(newStyles);

      // If settings are changed, and captions are available but not active, activate the default caption track
      const defaultLanguage = captionSettings.defaultCaptions?.language;
      if (defaultLanguage && !isAnyCaptionActive && captionsList.length > 0 && haveCaptionSettingsChanged) {
        const defaultCaptionIndex = captionsList.findIndex(caption =>
          caption.label === defaultLanguage || caption.lang === defaultLanguage.toLowerCase()
        );
        const captionIndex = defaultCaptionIndex !== -1 ? defaultCaptionIndex : 0;
        player.setCaptions(captionIndex);
      }
      setPrevSettings(captionSettings);
    }
  }, [getPlayerInstance, captionSettings, isAnyCaptionActive, haveCaptionSettingsChanged, captionsList]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.drawerContainer}>
      {showPreview && <SubtitlePreview />}
      <div
        ref={drawerRef}
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-label={intl.formatMessage(messages.captionSettings)}
      >
        <div className={styles.drawerHeader}>
          <button
            onClick={onBack || onClose}
            aria-label={intl.formatMessage(messages.goBack)}
            className={styles.backButton}
          >
            <ChevronLeft />
          </button>
          <h2 className={styles.drawerTitle}>
            {title || intl.formatMessage(messages.captionSettings)}
          </h2>
        </div>
        <div className={styles.drawerContent}>
          {children}
        </div>
      </div>
    </div>
  );
};
