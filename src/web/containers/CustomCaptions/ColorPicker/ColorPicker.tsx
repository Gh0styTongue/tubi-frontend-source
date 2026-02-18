import classNames from 'classnames';
import type { FC, MouseEvent } from 'react';
import React, { useCallback } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import type { Placement } from 'common/components/uilib/Popup/Popup';
import Popup from 'common/components/uilib/Popup/Popup';
import TubiCheckbox from 'common/components/uilib/TubiCheckbox/TubiCheckbox';
import type { ColorPickerName, ColorSetting } from 'common/types/captionSettings';
import Button from 'web/components/Button/Button';
import { BASIC_COLORS } from 'web/constants/captionSettings';

import styles from './ColorPicker.scss';

type PickerName = 'background' | 'window' | 'font' | 'styling';

const messages = defineMessages({
  none: {
    defaultMessage: 'None',
    description: 'None color option',
  },
});

export interface Props {
  onColorClick: (rgbValue: string) => void;
  pickerName: PickerName;
  isVisible: boolean;
  toggleMenu: (name: ColorPickerName) => void;
  colorSetting: ColorSetting;
  handleTransparencyClick?: (pickerName: PickerName) => void;
  menuPlacement: Placement;
  withNone?: boolean;
}

const ColorPicker: FC<Props> = ({
  onColorClick,
  pickerName,
  isVisible,
  toggleMenu,
  colorSetting,
  handleTransparencyClick,
  menuPlacement,
  withNone,
}) => {
  const intl = useIntl();

  const stopPropagation = useCallback((event: MouseEvent<HTMLDivElement>): void => {
    event.stopPropagation();
  }, []);

  const handleCurrentActiveColorClick = useCallback((): void => {
    toggleMenu(pickerName);
  }, [pickerName, toggleMenu]);

  const handleColorOptionClick = useCallback((rgbValue: string): void => {
    onColorClick(rgbValue);
  }, [onColorClick]);

  const handleTransparencyOptionClick = useCallback((): void => {
    handleTransparencyClick?.(pickerName);
  }, [handleTransparencyClick, pickerName]);

  const { activeRGBValue, isSemitransparent } = colorSetting;
  const mainClassNames = classNames(styles.colorPicker, {
    [styles.expanded]: isVisible,
  });

  return (
    <div className={mainClassNames} onClick={stopPropagation}>
      <div
        className={classNames(styles.currentActiveColor, {
          [styles.withX]: !activeRGBValue,
        })}
        style={activeRGBValue ? { backgroundColor: `rgb(${activeRGBValue})` } : undefined}
        onClick={handleCurrentActiveColorClick}
      />
      <Popup className={styles.popup} placement={menuPlacement}>
        {withNone ? (
          <Button
            size="normal"
            color="secondary"
            onClick={() => handleColorOptionClick('')}
            className={styles.noneButton}
          >
            {intl.formatMessage(messages.none)}
          </Button>
        ) : null}
        {BASIC_COLORS.map(({ value: rgbValue }) => {
          const colorClass = classNames(styles.color, {
            [styles.activeColorInMenu]: rgbValue === activeRGBValue,
          });
          return (
            <div
              key={rgbValue}
              className={colorClass}
              style={{ backgroundColor: `rgb(${rgbValue})` }}
              onClick={() => handleColorOptionClick(rgbValue)}
            />
          );
        })}
        {typeof isSemitransparent !== 'undefined' ? (
          <TubiCheckbox
            value="Semitransparent"
            checkboxKey="Semitransparent"
            checked={isSemitransparent}
            handleChange={handleTransparencyOptionClick}
          />
        ) : null}
      </Popup>
    </div>
  );
};

export default ColorPicker;
