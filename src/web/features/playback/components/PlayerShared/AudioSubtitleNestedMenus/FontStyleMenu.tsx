import { CheckmarkStroke } from '@tubitv/icons';
import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { saveWebCustomCaptions } from 'common/actions/webCaptionSettings';
import { captionSettingsSelector } from 'common/features/playback/selectors/captionSettings';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import type { StyleOption } from 'common/types/captionSettings';
import {
  WEB_FONT_SHADOW_STYLINGS_ARRAY,
  WEB_FONT_SHADOW_STYLINGS,
  webFontShadowStaticMessages,
} from 'web/constants/captionSettings';

import styles from '../AudioSubtitleMenuLayers.scss';
import { useKeyboardNavigation } from '../hooks/useMenuKeyboardNavigation';

interface MenuLayerProps {
  onNavigateTo: (menu: React.ReactNode) => void;
  onClose: () => void;
  onTitleChange?: (title: string) => void;
  onBack?: () => void;
}

const messages = defineMessages({
  fontStyle: {
    id: 'web.features.playback.components.PlayerShared.AudioSubtitleMenuLayers.fontStyle',
    description: 'label for font style menu',
    defaultMessage: 'Font Style',
  },
  textStylingOptions: {
    id: 'web.features.playback.components.PlayerShared.AudioSubtitleMenuLayers.textStylingOptions',
    description: 'label for text styling options section',
    defaultMessage: 'Text Styling Options',
  },
  noneDefault: {
    id: 'web.features.playback.components.PlayerShared.AudioSubtitleMenuLayers.noneDefault',
    description: 'label for none/default font style option',
    defaultMessage: 'None (Default)',
  },
});

export const FontStyleMenu: React.FC<MenuLayerProps> = ({ onClose, onTitleChange, onBack }) => {
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const captionSettings = useAppSelector(captionSettingsSelector);
  const { handleRadioKeyDown } = useKeyboardNavigation(onClose, onBack);

  // Set the title when component mounts
  useEffect(() => {
    onTitleChange?.(intl.formatMessage(messages.fontStyle));
  }, [intl, onTitleChange]);

  // Focus the selected option when component mounts (with delay to prevent pause)
  const selectedOptionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    selectedOptionRef.current?.focus();
  }, []);

  // Create styling options with custom "None (Default)" label
  const stylingOptions = useMemo(() => WEB_FONT_SHADOW_STYLINGS_ARRAY.map((option) => {
    if (option.value === 'none') {
      return {
        ...option,
        label: intl.formatMessage(messages.noneDefault),
      };
    }
    return {
      ...option,
      label: intl.formatMessage(webFontShadowStaticMessages[option.value!]),
    };
  }), [intl]);

  const handleStylingChange = useCallback((stylingType: StyleOption) => {
    dispatch(saveWebCustomCaptions({
      ...captionSettings,
      styling: {
        ...captionSettings.styling,
        stylingType: WEB_FONT_SHADOW_STYLINGS[stylingType.value!],
      },
    }));
  }, [dispatch, captionSettings]);

  const createStylingClickHandler = useCallback((option: StyleOption) => {
    return () => handleStylingChange(option);
  }, [handleStylingChange]);

  return (
    <div>
      <fieldset>
        <legend className={styles.srOnly}>{intl.formatMessage(messages.textStylingOptions)}</legend>
        <div role="radiogroup" aria-labelledby="text-styling-heading">
          {stylingOptions.map((option) => {
            const isSelected = captionSettings.styling.stylingType.value === option.value;
            return (
              <div
                key={option.value}
                ref={isSelected ? selectedOptionRef : null}
                role="radio"
                tabIndex={isSelected ? 0 : -1}
                aria-checked={isSelected}
                onClick={createStylingClickHandler(option)}
                onKeyDown={handleRadioKeyDown}
                className={classNames(styles.radioItem, {
                  [styles.selected]: isSelected,
                })}
              >
                {captionSettings.styling.stylingType.value === option.value ? (
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
