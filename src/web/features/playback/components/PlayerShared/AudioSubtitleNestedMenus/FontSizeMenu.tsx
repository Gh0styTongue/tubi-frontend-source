import { CheckmarkStroke } from '@tubitv/icons';
import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { setBasicCaptionSetting } from 'common/actions/webCaptionSettings';
import { captionSettingsSelector } from 'common/features/playback/selectors/captionSettings';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import type { FontSize } from 'common/types/captionSettings';
import { WEB_FONT_SIZE_OPTIONS_ARRAY } from 'web/constants/captionSettings';

import styles from '../AudioSubtitleMenuLayers.scss';
import { useKeyboardNavigation } from '../hooks/useMenuKeyboardNavigation';

interface MenuLayerProps {
  onNavigateTo: (menu: React.ReactNode) => void;
  onClose: () => void;
  onTitleChange?: (title: string) => void;
  onBack?: () => void;
}

const messages = defineMessages({
  fontSize: {
    id: 'web.features.playback.components.PlayerShared.AudioSubtitleMenuLayers.fontSize',
    description: 'label for font size menu',
    defaultMessage: 'Font Size',
  },
  fontSizeOptions: {
    id: 'web.features.playback.components.PlayerShared.AudioSubtitleMenuLayers.fontSizeOptions',
    description: 'label for font size options section',
    defaultMessage: 'Font Size Options',
  },
  small: {
    id: 'web.features.playback.components.PlayerShared.AudioSubtitleMenuLayers.small',
    description: 'label for small font size option',
    defaultMessage: 'Small',
  },
  medium: {
    id: 'web.features.playback.components.PlayerShared.AudioSubtitleMenuLayers.medium',
    description: 'label for medium font size option',
    defaultMessage: 'Medium',
  },
  large: {
    id: 'web.features.playback.components.PlayerShared.AudioSubtitleMenuLayers.large',
    description: 'label for large font size option',
    defaultMessage: 'Large',
  },
});

// Helper function to delocalize font size
const delocalizeFontSize = (localizedSize: FontSize): FontSize => {
  const sizeMap: Record<string, FontSize> = {
    small: WEB_FONT_SIZE_OPTIONS_ARRAY[0],
    medium: WEB_FONT_SIZE_OPTIONS_ARRAY[1],
    large: WEB_FONT_SIZE_OPTIONS_ARRAY[2],
  };
  return sizeMap[localizedSize.value!];
};

export const FontSizeMenu: React.FC<MenuLayerProps> = ({ onClose, onTitleChange, onBack }) => {
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const captionSettings = useAppSelector(captionSettingsSelector);
  const currentFontSize = captionSettings.font.size;
  const { handleRadioKeyDown } = useKeyboardNavigation(onClose, onBack);

  // Set the title when component mounts
  React.useEffect(() => {
    onTitleChange?.(intl.formatMessage(messages.fontSize));
  }, [intl, onTitleChange]);

  // Focus the selected option when component mounts (with delay to prevent pause)
  const selectedOptionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    selectedOptionRef.current?.focus();
  }, []);

  // Create font size options with full words
  const fontSizeOptions = useMemo(() => [
    { ...WEB_FONT_SIZE_OPTIONS_ARRAY[0], label: intl.formatMessage(messages.small) },
    { ...WEB_FONT_SIZE_OPTIONS_ARRAY[1], label: intl.formatMessage(messages.medium) },
    { ...WEB_FONT_SIZE_OPTIONS_ARRAY[2], label: intl.formatMessage(messages.large) },
  ], [intl]);

  const handleFontSizeChange = useCallback((size: FontSize) => {
    // Delocalize the font size before saving
    const delocalizedSize = delocalizeFontSize(size);
    dispatch(setBasicCaptionSetting({
      setting: 'font',
      attributeKey: 'size',
      attributeValue: delocalizedSize,
    }));
  }, [dispatch]);

  const createFontSizeClickHandler = useCallback((option: FontSize) => {
    return () => handleFontSizeChange(option);
  }, [handleFontSizeChange]);

  return (
    <div>
      <fieldset>
        <legend className={styles.srOnly}>{intl.formatMessage(messages.fontSizeOptions)}</legend>
        <div role="radiogroup" aria-labelledby="font-size-heading">
          {fontSizeOptions.map((option) => {
            const isSelected = currentFontSize.value === option.value;
            return (
              <div
                key={option.value}
                ref={isSelected ? selectedOptionRef : null}
                role="radio"
                tabIndex={isSelected ? 0 : -1}
                aria-checked={isSelected}
                onClick={createFontSizeClickHandler(option as FontSize)}
                onKeyDown={handleRadioKeyDown}
                className={classNames(styles.radioItem, {
                  [styles.selected]: isSelected,
                })}
              >
                {currentFontSize.value === option.value ? (
                  <span aria-hidden="true" className={styles.checkmark}><CheckmarkStroke /></span>
                ) : (
                  <span className={styles.checkmarkPlaceholder} />
                )}
                <span>{option.label}</span>
              </div>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
};
