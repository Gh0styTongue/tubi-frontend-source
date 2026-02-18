import { CheckmarkStroke } from '@tubitv/icons';
import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { saveWebCustomCaptions } from 'common/actions/webCaptionSettings';
import { captionSettingsSelector } from 'common/features/playback/selectors/captionSettings';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import { WEB_BACKGROUND_OPTIONS } from 'web/constants/captionSettings';

import styles from '../AudioSubtitleMenuLayers.scss';
import { useKeyboardNavigation } from '../hooks/useMenuKeyboardNavigation';

interface MenuLayerProps {
  onNavigateTo: (menu: React.ReactNode) => void;
  onClose: () => void;
  onTitleChange?: (title: string) => void;
  onBack?: () => void;
}

type TransparencyValue = '0' | '25' | '50' | '75' | '100';

const messages = defineMessages({
  backgroundTransparency: {
    id: 'web.features.playback.components.PlayerShared.AudioSubtitleMenuLayers.backgroundTransparency',
    description: 'label for font background menu',
    defaultMessage: 'Font Background',
  },
  backgroundTransparencyOptions: {
    id: 'web.features.playback.components.PlayerShared.AudioSubtitleMenuLayers.backgroundTransparencyOptions',
    description: 'label for background transparency options section',
    defaultMessage: 'Background Transparency Options',
  },
  percent0On: {
    id: 'web.features.playback.components.PlayerShared.AudioSubtitleMenuLayers.percent0On',
    description: 'label for 0% background transparency option (fully opaque)',
    defaultMessage: '0% (on)',
  },
  percent25: {
    id: 'web.features.playback.components.PlayerShared.AudioSubtitleMenuLayers.percent25',
    description: 'label for 25% background transparency option',
    defaultMessage: '25%',
  },
  percent50: {
    id: 'web.features.playback.components.PlayerShared.AudioSubtitleMenuLayers.percent50',
    description: 'label for 50% background transparency option',
    defaultMessage: '50%',
  },
  percent75: {
    id: 'web.features.playback.components.PlayerShared.AudioSubtitleMenuLayers.percent75',
    description: 'label for 75% background transparency option',
    defaultMessage: '75%',
  },
  percent100Off: {
    id: 'web.features.playback.components.PlayerShared.AudioSubtitleMenuLayers.percent100Off',
    description: 'label for 100% background transparency option (fully transparent)',
    defaultMessage: '100% (off)',
  },
});

export const BackgroundMenu: React.FC<MenuLayerProps> = ({ onClose, onTitleChange, onBack }) => {
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const captionSettings = useAppSelector(captionSettingsSelector);
  const { handleRadioKeyDown } = useKeyboardNavigation(onClose, onBack);

  // Set the title when component mounts
  useEffect(() => {
    onTitleChange?.(intl.formatMessage(messages.backgroundTransparency));
  }, [intl, onTitleChange]);

  // Focus the selected option when component mounts (with delay to prevent pause)
  const selectedOptionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    selectedOptionRef.current?.focus();
  }, []);

  // Create transparency options (transparency is inverse of opacity)
  const transparencyOptions = useMemo(() => [
    { value: '0', label: intl.formatMessage(messages.percent0On), opacity: 1.0 }, // 0% transparency = 100% opacity (on)
    { value: '25', label: intl.formatMessage(messages.percent25), opacity: 0.75 }, // 25% transparency = 75% opacity
    { value: '50', label: intl.formatMessage(messages.percent50), opacity: 0.5 }, // 50% transparency = 50% opacity
    { value: '75', label: intl.formatMessage(messages.percent75), opacity: 0.25 }, // 75% transparency = 25% opacity
    { value: '100', label: intl.formatMessage(messages.percent100Off), opacity: 0.0 }, // 100% transparency = 0% opacity (off)
  ], [intl]);

  const handleTransparencyChange = useCallback((transparencyValue: TransparencyValue) => {
    const selectedOption = transparencyOptions.find(opt => opt.value === transparencyValue);
    const isBackgroundEnabled = transparencyValue !== '100'; // 100% transparency means no background

    dispatch(saveWebCustomCaptions({
      ...captionSettings,
      background: {
        ...captionSettings.background,
        toggle: isBackgroundEnabled ? WEB_BACKGROUND_OPTIONS.on : WEB_BACKGROUND_OPTIONS.off,
        backgroundColor: {
          ...captionSettings.background.backgroundColor,
          opacity: selectedOption?.opacity,
        },
      },
    }));
  }, [dispatch, captionSettings, transparencyOptions]);

  const createTransparencyClickHandler = useCallback((transparencyValue: TransparencyValue) => {
    return () => handleTransparencyChange(transparencyValue);
  }, [handleTransparencyChange]);

  return (
    <div>
      <fieldset>
        <legend className={styles.srOnly}>{intl.formatMessage(messages.backgroundTransparencyOptions)}</legend>
        <div role="radiogroup" aria-labelledby="background-transparency-heading">
          {transparencyOptions.map((option) => {
            const isBackgroundEnabled = captionSettings.background.toggle.value === 'on';
            const currentOpacity = isBackgroundEnabled
              ? (captionSettings.background.backgroundColor.opacity || 1.0)
              : 0.0; // When background is off, show 100% transparency (0% opacity)

            // Find the transparency option that matches the current opacity (legacy default is 80%)
            const matchingOption = transparencyOptions.find(opt => Math.abs(opt.opacity - currentOpacity) < 0.1);
            const isSelected = matchingOption?.value === option.value;

            return (
              <div
                key={option.value}
                ref={isSelected ? selectedOptionRef : null}
                role="radio"
                tabIndex={isSelected ? 0 : -1}
                aria-checked={isSelected}
                onClick={createTransparencyClickHandler(option.value as TransparencyValue)}
                onKeyDown={handleRadioKeyDown}
                className={classNames(styles.radioItem, {
                  [styles.selected]: isSelected,
                })}
              >
                {isSelected ? (
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
