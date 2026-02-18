import { CheckmarkStroke } from '@tubitv/icons';
import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { saveWebCustomCaptions } from 'common/actions/webCaptionSettings';
import { captionSettingsSelector } from 'common/features/playback/selectors/captionSettings';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';

import styles from '../AudioSubtitleMenuLayers.scss';
import { useKeyboardNavigation } from '../hooks/useMenuKeyboardNavigation';

interface MenuLayerProps {
  onNavigateTo: (menu: React.ReactNode) => void;
  onClose: () => void;
  onTitleChange?: (title: string) => void;
  onBack?: () => void;
}

const messages = defineMessages({
  fontColor: {
    id: 'web.features.playback.components.PlayerShared.AudioSubtitleMenuLayers.fontColor',
    description: 'label for font color menu',
    defaultMessage: 'Font Color',
  },
  fontColorOptions: {
    id: 'web.features.playback.components.PlayerShared.AudioSubtitleMenuLayers.fontColorOptions',
    description: 'label for font color options section',
    defaultMessage: 'Font Color Options',
  },
  white: {
    id: 'web.features.playback.components.PlayerShared.AudioSubtitleMenuLayers.white',
    description: 'label for white font color option',
    defaultMessage: 'White',
  },
  black: {
    id: 'web.features.playback.components.PlayerShared.AudioSubtitleMenuLayers.black',
    description: 'label for black font color option',
    defaultMessage: 'Black',
  },
  red: {
    id: 'web.features.playback.components.PlayerShared.AudioSubtitleMenuLayers.red',
    description: 'label for red font color option',
    defaultMessage: 'Red',
  },
  green: {
    id: 'web.features.playback.components.PlayerShared.AudioSubtitleMenuLayers.green',
    description: 'label for green font color option',
    defaultMessage: 'Green',
  },
  blue: {
    id: 'web.features.playback.components.PlayerShared.AudioSubtitleMenuLayers.blue',
    description: 'label for blue font color option',
    defaultMessage: 'Blue',
  },
  yellow: {
    id: 'web.features.playback.components.PlayerShared.AudioSubtitleMenuLayers.yellow',
    description: 'label for yellow font color option',
    defaultMessage: 'Yellow',
  },
  magenta: {
    id: 'web.features.playback.components.PlayerShared.AudioSubtitleMenuLayers.magenta',
    description: 'label for magenta font color option',
    defaultMessage: 'Magenta',
  },
  cyan: {
    id: 'web.features.playback.components.PlayerShared.AudioSubtitleMenuLayers.cyan',
    description: 'label for cyan font color option',
    defaultMessage: 'Cyan',
  },
});

export const FontColorMenu: React.FC<MenuLayerProps> = ({ onClose, onTitleChange, onBack }) => {
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const captionSettings = useAppSelector(captionSettingsSelector);
  const { handleRadioKeyDown } = useKeyboardNavigation(onClose, onBack);

  // Set the title when component mounts
  useEffect(() => {
    onTitleChange?.(intl.formatMessage(messages.fontColor));
  }, [intl, onTitleChange]);

  // Focus the selected option when component mounts (with delay to prevent pause)
  const selectedOptionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    selectedOptionRef.current?.focus();
  }, []);

  // Create color options
  const colorOptions = useMemo(() => [
    { value: '255, 255, 255', label: intl.formatMessage(messages.white) },
    { value: '0, 0, 0', label: intl.formatMessage(messages.black) },
    { value: '255, 0, 0', label: intl.formatMessage(messages.red) },
    { value: '0, 128, 0', label: intl.formatMessage(messages.green) },
    { value: '0, 0, 255', label: intl.formatMessage(messages.blue) },
    { value: '255, 255, 0', label: intl.formatMessage(messages.yellow) },
    { value: '255, 0, 255', label: intl.formatMessage(messages.magenta) },
    { value: '0, 255, 255', label: intl.formatMessage(messages.cyan) },
  ], [intl]);

  const handleColorChange = useCallback((colorValue: string) => {
    dispatch(saveWebCustomCaptions({
      ...captionSettings,
      font: {
        ...captionSettings.font,
        fontColor: {
          ...captionSettings.font.fontColor,
          activeRGBValue: colorValue,
        },
      },
    }));
  }, [dispatch, captionSettings]);

  const createColorClickHandler = useCallback((colorValue: string) => {
    return () => handleColorChange(colorValue);
  }, [handleColorChange]);

  return (
    <div>
      <fieldset>
        <legend className={styles.srOnly}>{intl.formatMessage(messages.fontColorOptions)}</legend>
        <div role="radiogroup" aria-labelledby="font-color-heading">
          {colorOptions.map((option) => {
            const isSelected = captionSettings.font.fontColor.activeRGBValue === option.value;
            return (
              <div
                key={option.value}
                ref={isSelected ? selectedOptionRef : null}
                role="radio"
                tabIndex={isSelected ? 0 : -1}
                aria-checked={isSelected}
                onClick={createColorClickHandler(option.value)}
                onKeyDown={handleRadioKeyDown}
                className={classNames(styles.radioItem, {
                  [styles.selected]: isSelected,
                })}
              >
                {captionSettings.font.fontColor.activeRGBValue === option.value ? (
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
