import { CheckmarkStroke } from '@tubitv/icons';
import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { saveWebCustomCaptions } from 'common/actions/webCaptionSettings';
import { captionSettingsSelector } from 'common/features/playback/selectors/captionSettings';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import { WEB_FONTS } from 'web/constants/captionSettings';

import styles from '../AudioSubtitleMenuLayers.scss';
import { useKeyboardNavigation } from '../hooks/useMenuKeyboardNavigation';

interface MenuLayerProps {
  onNavigateTo: (menu: React.ReactNode) => void;
  onClose: () => void;
  onTitleChange?: (title: string) => void;
  onBack?: () => void;
}

const messages = defineMessages({
  fontFamily: {
    id: 'web.features.playback.components.PlayerShared.AudioSubtitleMenuLayers.fontFamily',
    description: 'label for font family menu',
    defaultMessage: 'Font Family',
  },
  fontFamilyOptions: {
    id: 'web.features.playback.components.PlayerShared.AudioSubtitleMenuLayers.fontFamilyOptions',
    description: 'label for font family options section',
    defaultMessage: 'Font Family Options',
  },
  block: {
    id: 'web.features.playback.components.PlayerShared.AudioSubtitleMenuLayers.block',
    description: 'label for block font family option',
    defaultMessage: 'Block',
  },
  typewriter: {
    id: 'web.features.playback.components.PlayerShared.AudioSubtitleMenuLayers.typewriter',
    description: 'label for typewriter font family option',
    defaultMessage: 'Typewriter',
  },
  print: {
    id: 'web.features.playback.components.PlayerShared.AudioSubtitleMenuLayers.print',
    description: 'label for print font family option',
    defaultMessage: 'Print',
  },
  console: {
    id: 'web.features.playback.components.PlayerShared.AudioSubtitleMenuLayers.console',
    description: 'label for console font family option',
    defaultMessage: 'Console',
  },
  casual: {
    id: 'web.features.playback.components.PlayerShared.AudioSubtitleMenuLayers.casual',
    description: 'label for casual font family option',
    defaultMessage: 'Casual',
  },
  cursive: {
    id: 'web.features.playback.components.PlayerShared.AudioSubtitleMenuLayers.cursive',
    description: 'label for cursive font family option',
    defaultMessage: 'Cursive',
  },
  smallCaps: {
    id: 'web.features.playback.components.PlayerShared.AudioSubtitleMenuLayers.smallCaps',
    description: 'label for small caps font family option',
    defaultMessage: 'Small Caps',
  },
});

export const FontFamilyMenu: React.FC<MenuLayerProps> = ({ onClose, onTitleChange, onBack }) => {
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const captionSettings = useAppSelector(captionSettingsSelector);
  const currentFontFamily = captionSettings.font.family;
  const { handleRadioKeyDown } = useKeyboardNavigation(onClose, onBack);

  // Set the title when component mounts
  useEffect(() => {
    onTitleChange?.(intl.formatMessage(messages.fontFamily));
  }, [intl, onTitleChange]);

  // Focus the selected option when component mounts
  const selectedOptionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    selectedOptionRef.current?.focus();
  }, []);

  // Create font family options with localized labels
  const fontFamilyOptions = useMemo(() => [
    { ...WEB_FONTS.block, label: intl.formatMessage(messages.block) },
    { ...WEB_FONTS.typewriter, label: intl.formatMessage(messages.typewriter) },
    { ...WEB_FONTS.print, label: intl.formatMessage(messages.print) },
    { ...WEB_FONTS.console, label: intl.formatMessage(messages.console) },
    { ...WEB_FONTS.casual, label: intl.formatMessage(messages.casual) },
    { ...WEB_FONTS.cursive, label: intl.formatMessage(messages.cursive) },
    { ...WEB_FONTS.smallcaps, label: intl.formatMessage(messages.smallCaps) },
  ], [intl]);

  const handleFontFamilyChange = useCallback((fontFamily: typeof WEB_FONTS.block) => {
    dispatch(saveWebCustomCaptions({
      ...captionSettings,
      font: {
        ...captionSettings.font,
        family: fontFamily,
      },
    }));
  }, [dispatch, captionSettings]);

  const createFontFamilyClickHandler = useCallback((fontFamily: typeof WEB_FONTS.block) => {
    return () => handleFontFamilyChange(fontFamily);
  }, [handleFontFamilyChange]);

  return (
    <div>
      <fieldset>
        <legend className={styles.srOnly}>{intl.formatMessage(messages.fontFamilyOptions)}</legend>
        <div role="radiogroup" aria-labelledby="font-family-heading">
          {fontFamilyOptions.map((option) => {
            const isSelected = currentFontFamily.value === option.value;
            return (
              <div
                key={option.value}
                ref={isSelected ? selectedOptionRef : null}
                role="radio"
                tabIndex={isSelected ? 0 : -1}
                aria-checked={isSelected}
                onClick={createFontFamilyClickHandler(option as typeof WEB_FONTS.block)}
                onKeyDown={handleRadioKeyDown}
                className={classNames(styles.radioItem, {
                  [styles.selected]: isSelected,
                })}
              >
                {currentFontFamily.value === option.value ? (
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
