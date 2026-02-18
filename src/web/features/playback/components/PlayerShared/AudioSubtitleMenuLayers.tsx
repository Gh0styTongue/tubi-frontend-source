import { ChevronRight } from '@tubitv/icons';
import React, { useCallback, useEffect, useRef } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import styles from './AudioSubtitleMenuLayers.scss';
import { BackgroundMenu } from './AudioSubtitleNestedMenus/BackgroundMenu';
import { FontColorMenu } from './AudioSubtitleNestedMenus/FontColorMenu';
import { FontFamilyMenu } from './AudioSubtitleNestedMenus/FontFamilyMenu';
import { FontSizeMenu } from './AudioSubtitleNestedMenus/FontSizeMenu';
import { FontStyleMenu } from './AudioSubtitleNestedMenus/FontStyleMenu';
import { useKeyboardNavigation } from './hooks/useMenuKeyboardNavigation';
interface MenuLayerProps {
  onNavigateTo: (menu: React.ReactNode) => void;
  onClose: () => void;
  onTitleChange?: (title: string) => void;
  onBack?: () => void;
  openedViaKeyboard?: boolean;
}

const messages = defineMessages({
  basicSettings: {
    id: 'web.features.playback.components.PlayerShared.AudioSubtitleMenuLayers.basicSettings',
    description: 'label for advanced subtitles settings menu option',
    defaultMessage: 'Subtitles Settings',
  },
  fontSize: {
    id: 'web.features.playback.components.PlayerShared.AudioSubtitleMenuLayers.fontSize',
    description: 'label for font size menu option',
    defaultMessage: 'Size',
  },
  background: {
    id: 'web.features.playback.components.PlayerShared.AudioSubtitleMenuLayers.background',
    description: 'label for font background menu option',
    defaultMessage: 'Background',
  },
  fontStyle: {
    id: 'web.features.playback.components.PlayerShared.AudioSubtitleMenuLayers.fontStyle',
    description: 'label for font style menu option',
    defaultMessage: 'Style',
  },
  fontColor: {
    id: 'web.features.playback.components.PlayerShared.AudioSubtitleMenuLayers.fontColor',
    description: 'label for font color menu option',
    defaultMessage: 'Color',
  },
  fontFamily: {
    id: 'web.features.playback.components.PlayerShared.AudioSubtitleMenuLayers.fontFamily',
    description: 'label for font family menu option',
    defaultMessage: 'Font Family',
  },
  captionSettingsMenu: {
    id: 'web.features.playback.components.PlayerShared.AudioSubtitleMenuLayers.captionSettingsMenu',
    description: 'aria-label for subtitles settings menu',
    defaultMessage: 'Subtitles settings menu',
  },
});

export const useBackToMainCallback = (onNavigateTo: MenuLayerProps['onNavigateTo'], onClose: MenuLayerProps['onClose'], onTitleChange: MenuLayerProps['onTitleChange'], onBack: MenuLayerProps['onBack'], openedViaKeyboard?: boolean) => {
  return useCallback(() => {
    onNavigateTo(<MainCaptionMenu onNavigateTo={onNavigateTo} onClose={onClose} onTitleChange={onTitleChange} onBack={onBack} openedViaKeyboard={openedViaKeyboard} />);
  }, [onNavigateTo, onClose, onTitleChange, onBack, openedViaKeyboard]);
};

export const MainCaptionMenu: React.FC<MenuLayerProps> = ({ onNavigateTo, onClose, onTitleChange, onBack, openedViaKeyboard = false }) => {
  const intl = useIntl();
  const firstMenuItemRef = useRef<HTMLDivElement>(null);

  // Create a function that goes back to MainCaptionMenu for child menus
  const handleBackToMain = useBackToMainCallback(onNavigateTo, onClose, onTitleChange, onBack, openedViaKeyboard);

  // Navigation callbacks
  const handleFontSizeClick = useCallback(() => {
    onNavigateTo(<FontSizeMenu onNavigateTo={onNavigateTo} onClose={onClose} onTitleChange={onTitleChange} onBack={handleBackToMain} />);
  }, [onNavigateTo, onClose, onTitleChange, handleBackToMain]);

  const handleFontColorClick = useCallback(() => {
    onNavigateTo(<FontColorMenu onNavigateTo={onNavigateTo} onClose={onClose} onTitleChange={onTitleChange} onBack={handleBackToMain} />);
  }, [onNavigateTo, onClose, onTitleChange, handleBackToMain]);

  const handleFontStyleClick = useCallback(() => {
    onNavigateTo(<FontStyleMenu onNavigateTo={onNavigateTo} onClose={onClose} onTitleChange={onTitleChange} onBack={handleBackToMain} />);
  }, [onNavigateTo, onClose, onTitleChange, handleBackToMain]);

  const handleBackgroundClick = useCallback(() => {
    onNavigateTo(<BackgroundMenu onNavigateTo={onNavigateTo} onClose={onClose} onTitleChange={onTitleChange} onBack={handleBackToMain} />);
  }, [onNavigateTo, onClose, onTitleChange, handleBackToMain]);

  const handleFontFamilyClick = useCallback(() => {
    onNavigateTo(<FontFamilyMenu onNavigateTo={onNavigateTo} onClose={onClose} onTitleChange={onTitleChange} onBack={handleBackToMain} />);
  }, [onNavigateTo, onClose, onTitleChange, handleBackToMain]);

  // Set the title when component mounts
  useEffect(() => {
    onTitleChange?.(intl.formatMessage(messages.basicSettings));
  }, [intl, onTitleChange]);

  // Focus the first menu item when component mounts (with delay to prevent pause)
  // Only focus if the user navigated here via keyboard
  useEffect(() => {
    if (openedViaKeyboard) {
      firstMenuItemRef.current?.focus();
    }
  }, [openedViaKeyboard]);

  const { handleMenuKeyDown } = useKeyboardNavigation(onClose, onBack);

  return (
    <nav
      aria-label={intl.formatMessage(messages.captionSettingsMenu)}
    >
      <div role="menu">
        <div
          ref={firstMenuItemRef}
          role="menuitem"
          tabIndex={0}
          aria-haspopup="menu"
          onClick={handleFontSizeClick}
          onKeyDown={handleMenuKeyDown}
          className={styles.menuItem}
        >
          <span>{intl.formatMessage(messages.fontSize)}</span>
          <span aria-hidden="true" className={styles.menuArrow}><ChevronRight /></span>
        </div>

        <div
          role="menuitem"
          tabIndex={0}
          aria-haspopup="menu"
          onClick={handleFontColorClick}
          onKeyDown={handleMenuKeyDown}
          className={styles.menuItem}
        >
          <span>{intl.formatMessage(messages.fontColor)}</span>
          <span aria-hidden="true" className={styles.menuArrow}><ChevronRight /></span>
        </div>

        <div
          role="menuitem"
          tabIndex={0}
          aria-haspopup="menu"
          onClick={handleFontFamilyClick}
          onKeyDown={handleMenuKeyDown}
          className={styles.menuItem}
        >
          <span>{intl.formatMessage(messages.fontFamily)}</span>
          <span aria-hidden="true" className={styles.menuArrow}><ChevronRight /></span>
        </div>

        <div
          role="menuitem"
          tabIndex={0}
          aria-haspopup="menu"
          onClick={handleFontStyleClick}
          onKeyDown={handleMenuKeyDown}
          className={styles.menuItem}
        >
          <span>{intl.formatMessage(messages.fontStyle)}</span>
          <span aria-hidden="true" className={styles.menuArrow}><ChevronRight /></span>
        </div>

        <div
          role="menuitem"
          tabIndex={0}
          aria-haspopup="menu"
          onClick={handleBackgroundClick}
          onKeyDown={handleMenuKeyDown}
          className={styles.menuItem}
        >
          <span>{intl.formatMessage(messages.background)}</span>
          <span aria-hidden="true" className={styles.menuArrow}><ChevronRight /></span>
        </div>
      </div>
    </nav>
  );
};

