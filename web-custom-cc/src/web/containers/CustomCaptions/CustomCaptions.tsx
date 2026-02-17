import type { SelectOptions, SelectProps } from '@adrise/web-ui/lib/Select/Select';
import Select from '@adrise/web-ui/lib/Select/Select';
import { Col, Container, Row, Button } from '@tubitv/web-ui';
import classNames from 'classnames';
import isEqual from 'lodash/isEqual';
import React, { Component, type FunctionComponent } from 'react';
import type { IntlShape, MessageDescriptor, WrappedComponentProps } from 'react-intl';
import { defineMessages, injectIntl } from 'react-intl';
import { connect } from 'react-redux';

import { getLocalCaptions, loadWebCustomCaptions, saveWebCustomCaptions } from 'common/actions/webCaptionSettings';
import { initialState as initialCaptionsState } from 'common/reducers/webCaptionSettings';
import type {
  ColorPickerName,
  ColorSetting, FontSize, StyleOption,
  WebCaptionSettingsState,
} from 'common/types/captionSettings';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import { computeWebCaptionStyles } from 'common/utils/captionTools';
import { addEventListener, removeEventListener } from 'common/utils/dom';
import OptionTabs from 'web/components/OptionTabs/OptionTabs';
import {
  inverseWebFontSizeStaticMessages,
  webFontBackgroundStaticMessages,
  webFontShadowStaticMessages,
  webFontSizeStaticMessages,
  webFontStaticMessages,
  WEB_BACKGROUND_OPTIONS_ARRAY,
  WEB_FONTS,
  WEB_FONT_OPTIONS_ARRAY,
  WEB_FONT_SHADOW_STYLINGS,
  WEB_FONT_SHADOW_STYLINGS_ARRAY,
  WEB_FONT_SIZE_OPTIONS_ARRAY,
} from 'web/constants/captionSettings';
import ColorPicker from 'web/containers/CustomCaptions/ColorPicker/ColorPicker';

import styles from './CustomCaptions.scss';

export type Props = {
  captionSettings: WebCaptionSettingsState;
  dispatch: TubiThunkDispatch,
  intl: IntlShape,
};

export type State = {
  advancedSettingsExpanded: boolean;
  captionSettings: WebCaptionSettingsState;
  activeColorPicker: ColorPickerName | '';
  unsaved: boolean;
  loaded: boolean;
};

export type ComposedProps = Props & WrappedComponentProps;

const messages = defineMessages({
  titleHeading: {
    description: 'main title for page',
    defaultMessage: 'Subtitles and Appearance',
  },
  titleSubheading: {
    description: 'subtitle for page',
    defaultMessage: 'Change the way subtitles appear on all your supported devices',
  },
  settings: {
    description: 'title of basic settings section',
    defaultMessage: 'Settings',
  },
  settingsFontSize: {
    description: 'title of basic setting font section',
    defaultMessage: 'Font Size',
  },
  settingsBackground: {
    description: 'title of basic setting background section',
    defaultMessage: 'Background',
  },
  previewText: {
    description: 'description informing user of preview',
    defaultMessage: 'This is how your subtitles and captions will look',
  },
  advancedSettings: {
    description: 'title of advanced setting section',
    defaultMessage: 'Advanced Settings',
  },
  fontOptionsLabel: {
    description: 'label for font selection list',
    defaultMessage: 'Font',
  },
  stylingOptionsLabel: {
    description: 'label for styling selection list',
    defaultMessage: 'Styling',
  },
  backgroundColorLabel: {
    description: 'label for background color options',
    defaultMessage: 'Background Color',
  },
  windowColorLabel: {
    description: 'label for window color options',
    defaultMessage: 'Window Color',
  },
  resetButtonText: {
    description: 'text for the reset settings button',
    defaultMessage: 'Reset Settings',
  },
  refreshInstructions: {
    description: 'text instructing user how to see changes',
    defaultMessage: 'Please refresh the video page to update your captions',
  },
  unsavedText: {
    description: 'text for save button when unsaved changes',
    defaultMessage: 'Save',
  },
  savedText: {
    description: 'text for save button when all changes are saved',
    defaultMessage: 'Saved!',
  },
});

export class CustomCaptions extends Component<ComposedProps, State> {
  localizedFontStyleOptionsArray: SelectOptions[] = this.localizeArrayOfOptions(
    WEB_FONT_SHADOW_STYLINGS_ARRAY,
    webFontShadowStaticMessages,
  );

  localizedFontOptionsArray: SelectOptions[] = this.localizeArrayOfOptions(
    WEB_FONT_OPTIONS_ARRAY,
    webFontStaticMessages,
  );

  localizedFontSizeOptionsArray: FontSize[] = this.localizeArrayOfOptions(
    WEB_FONT_SIZE_OPTIONS_ARRAY,
    webFontSizeStaticMessages,
  ) as FontSize[];

  localizedFontBackgroundOptionsArray: StyleOption[] = this.localizeArrayOfOptions(
    WEB_BACKGROUND_OPTIONS_ARRAY,
    webFontBackgroundStaticMessages,
  );

  constructor(props: ComposedProps) {
    super(props);
    this.state = {
      // captionSettings data flow: localStorage ==> redux state + state in this component
      captionSettings: props.captionSettings,
      advancedSettingsExpanded: false,
      activeColorPicker: '',
      unsaved: true,
      loaded: false,
    };
  }

  componentDidMount() {
    addEventListener(window, 'click', this.clearColorMenu);
    const captionSettings = getLocalCaptions();
    const newState: any = { loaded: true };
    if (captionSettings) {
      this.props.dispatch(loadWebCustomCaptions(captionSettings));
      newState.captionSettings = JSON.parse(captionSettings);
    }
    this.setState(newState);
  }

  componentWillUnmount() {
    removeEventListener(window, 'click', this.clearColorMenu);
  }

  componentDidUpdate(_: Props, prevState: State) {
    if (!isEqual(prevState.captionSettings, this.state.captionSettings)) {
      this.setState({ unsaved: true });
    }
  }

  localizeArrayOfOptions(options: (StyleOption | SelectOptions)[], staticMessages: { [key: string]: MessageDescriptor }) {
    return options.map((style) => {
      return {
        ...style,
        value: style.value ?? '',
        label: this.props.intl.formatMessage(staticMessages[style.value!]),
      };
    });
  }

  /* state update methods / click handlers */
  toggleAdvancedSettings = (): void => {

    this.setState({
      advancedSettingsExpanded: !this.state.advancedSettingsExpanded,
    });
  };

  handleFontSizeChange = (idx: number): void => {
    const size = this.delocalizeFontSize(this.localizedFontSizeOptionsArray[idx]);
    this.updateOptionTabsState({
      font: {
        ...this.state.captionSettings.font,
        size,
      },
    });
  };

  handleBackgroundVisibilityChange = (idx: number): void => {
    this.updateOptionTabsState({
      background: {
        ...this.state.captionSettings.background,
        toggle: this.localizedFontBackgroundOptionsArray[idx],
      },
    });
  };

  updateOptionTabsState = (newState: Record<string, unknown>): void => {
    this.setState({
      captionSettings: {
        ...this.state.captionSettings,
        ...newState,
      },
    });
  };

  handleColorClick = (rgbValue: string): void => this.updateColorSettingState({ activeRGBValue: rgbValue });

  handleFontFamilyChange = (e: { target: { value: string } }): void => {
    this.setState({
      captionSettings: {
        ...this.state.captionSettings,
        font: {
          ...this.state.captionSettings.font,
          family: WEB_FONTS[e.target.value],
        },
      },
    });
  };

  handleFontStylingChange = (e: { target: { value: string }}): void => {
    this.setState({
      captionSettings: {
        ...this.state.captionSettings,
        styling: {
          ...this.state.captionSettings.styling,
          stylingType: WEB_FONT_SHADOW_STYLINGS[e.target.value],
        },
      },
    });
  };

  toggleColorMenu = (pickerName: ColorPickerName): void => {
    if (pickerName === this.state.activeColorPicker) {
      this.clearColorMenu();
      return;
    }
    this.setState({
      activeColorPicker: pickerName,
    });
  };

  toggleSemitransparency = (): void => {
    const { captionSettings, activeColorPicker } = this.state;
    const targetSetting = captionSettings[activeColorPicker];
    this.updateColorSettingState({
      isSemitransparent: !targetSetting[`${activeColorPicker}Color`].isSemitransparent,
    });
  };

  updateColorSettingState = (newState: Partial<ColorSetting>) => {
    const { activeColorPicker, captionSettings } = this.state;
    const targetSetting = captionSettings[activeColorPicker];
    const targetState = targetSetting[`${activeColorPicker}Color`];
    this.setState({
      captionSettings: {
        ...captionSettings,
        [activeColorPicker]: {
          ...targetSetting,
          [`${activeColorPicker}Color`]: {
            ...targetState,
            ...newState,
          },
        },
      },
    });
  };

  clearColorMenu = () => {
    if (this.state.activeColorPicker) this.setState({ activeColorPicker: '' });
  };

  /* methods for reset and save */
  handleReset = () => {
    this.setState({
      captionSettings: initialCaptionsState,
    });
  };

  delocalizeFontSize = (fontSize: FontSize): FontSize => {
    return {
      ...fontSize,
      label: inverseWebFontSizeStaticMessages[fontSize.label],
    };
  };

  handleSave = () => {
    this.props.dispatch(saveWebCustomCaptions(this.state.captionSettings));
    this.setState({ unsaved: false });
  };

  render() {
    const {
      captionSettings,
      activeColorPicker,
      advancedSettingsExpanded,
      unsaved,
      loaded,
    } = this.state;
    const { intl: { formatMessage } } = this.props;

    const { font, background, styling, window: windowWrapper } = captionSettings;
    const { size, family } = font;
    const { toggle } = background;
    const { stylingType } = styling;
    const advancedSettingsClass = classNames(styles.advancedSettingsSection, {
      [styles.expanded]: advancedSettingsExpanded,
    });
    const saveButtonText = formatMessage(unsaved ? messages.unsavedText : messages.savedText);

    const { font: computedFontStyle, window: computedWindowStyle } = computeWebCaptionStyles(captionSettings, true);

    const SelectWithNative = Select as FunctionComponent<SelectProps & { name?: string, native: boolean, pickerName?: string }>;

    return (
      <Container className={styles.customCaptionsWrapper}>
        {loaded ? (
          <Row className={styles.captionsRow} data-test-id="custom-captions-content">
            <Col xs="12" sMd="4" className={styles.customCaptionsMain}>
              <div className={styles.headingSection}>
                <div className={styles.heading}>
                  {formatMessage(messages.titleHeading)}
                </div>
                <div className={styles.subheading}>
                  {formatMessage(messages.titleSubheading)}
                </div>
              </div>

              <div className={styles.basicSettings}>
                <div className={styles.subtitle}>
                  {formatMessage(messages.settings)}
                </div>
                <Row className={styles.basicSettingsButtons}>
                  <Col className={styles.buttonCol}>
                    {formatMessage(messages.settingsFontSize)}
                    <OptionTabs
                      options={this.localizedFontSizeOptionsArray}
                      activeLabel={size.label[0]}
                      onOptionSelect={this.handleFontSizeChange}
                    />
                  </Col>
                  <Col className={styles.buttonCol}>
                    {formatMessage(messages.settingsBackground)}
                    <OptionTabs
                      options={this.localizedFontBackgroundOptionsArray}
                      activeLabel={toggle.label}
                      onOptionSelect={this.handleBackgroundVisibilityChange}
                    />
                  </Col>
                </Row>
                <Row className={styles.captionsPreviewWrapper}>
                  <Col xs="10" style={{ ...computedWindowStyle, top: '30%' }} data-test-id="captions-preview-col">
                    <div className={styles.captionsPreview} style={computedFontStyle}>
                      {/* eslint-disable-next-line react/jsx-no-literals -- no i18n needed for punctuation */}
                      {formatMessage(messages.previewText)}.
                    </div>
                  </Col>
                </Row>
              </div>

              <div className={styles.separatorLine} />

              <div className={advancedSettingsClass}>
                <div className={styles.subtitle} onClick={this.toggleAdvancedSettings}>
                  {formatMessage(messages.advancedSettings)}
                </div>

                <div className={styles.advancedSettings}>
                  <Row className={styles.dropdownOptionsRow}>
                    <Col xs="10" data-test-id="custom-captions-font-selector">
                      <SelectWithNative
                        name="font"
                        label={formatMessage(messages.fontOptionsLabel)}
                        value={family.value}
                        native={false}
                        fixedLabel
                        options={this.localizedFontOptionsArray}
                        className={styles.dropdown}
                        onChange={this.handleFontFamilyChange}
                      />
                    </Col>
                    <Col xs="2">
                      <ColorPicker
                        handleTransparencyClick={this.toggleSemitransparency}
                        isVisible={activeColorPicker === 'font'}
                        toggleMenu={this.toggleColorMenu}
                        pickerName="font"
                        onColorClick={this.handleColorClick}
                        colorSetting={font.fontColor}
                        menuPlacement="bottomRight"
                      />
                    </Col>
                  </Row>

                  <Row className={styles.dropdownOptionsRow}>
                    <Col xs="10" data-test-id="custom-captions-styling-selector">
                      <SelectWithNative
                        pickerName="styling"
                        label={formatMessage(messages.stylingOptionsLabel)}
                        value={stylingType.value}
                        native={false}
                        fixedLabel
                        options={this.localizedFontStyleOptionsArray}
                        className={styles.dropdown}
                        onChange={this.handleFontStylingChange}
                      />
                    </Col>
                    <Col xs="2">
                      <ColorPicker
                        isVisible={activeColorPicker === 'styling'}
                        toggleMenu={this.toggleColorMenu}
                        pickerName="styling"
                        onColorClick={this.handleColorClick}
                        colorSetting={styling.stylingColor}
                        menuPlacement="bottomRight"
                      />
                    </Col>
                  </Row>

                  <Row className={styles.colorOptionsRow}>
                    <Col xs="6">
                      <div className={styles.colorOptionsTitle}>{formatMessage(messages.backgroundColorLabel)}</div>
                      <ColorPicker
                        handleTransparencyClick={this.toggleSemitransparency}
                        isVisible={activeColorPicker === 'background'}
                        toggleMenu={this.toggleColorMenu}
                        pickerName="background"
                        onColorClick={this.handleColorClick}
                        colorSetting={background.backgroundColor}
                        menuPlacement="bottomLeft"
                      />
                    </Col>
                    <Col xs="6">
                      <div className={styles.colorOptionsTitle}>{formatMessage(messages.windowColorLabel)}</div>
                      <ColorPicker
                        withNone
                        handleTransparencyClick={this.toggleSemitransparency}
                        isVisible={activeColorPicker === 'window'}
                        toggleMenu={this.toggleColorMenu}
                        pickerName="window"
                        onColorClick={this.handleColorClick}
                        colorSetting={windowWrapper.windowColor}
                        menuPlacement="bottomRight"
                      />
                    </Col>
                  </Row>
                </div>
              </div>

              <Row className={styles.buttonRow}>
                <Col xs="6">
                  <Button
                    appearance="secondary"
                    className={styles.button}
                    onClick={this.handleReset}
                  >
                    {formatMessage(messages.resetButtonText)}
                  </Button>
                </Col>
                <Col xs="6">
                  <Button
                    appearance="primary"
                    disabled={!unsaved}
                    className={classNames(styles.button, styles.save)}
                    color="red"
                    onClick={this.handleSave}
                  >
                    {saveButtonText}
                  </Button>
                </Col>
              </Row>
              {unsaved ? null
                : <Col className={styles.subheading}>{formatMessage(messages.refreshInstructions)}</Col>
              }
            </Col>
          </Row>
        ) : null}
      </Container>
    );
  }
}

const mapStateToProps = ({ captionSettings }: { captionSettings: WebCaptionSettingsState }) => {
  return {
    captionSettings,
  };
};

export default connect(mapStateToProps)(injectIntl(CustomCaptions));
