import type { SelectOptions } from '@adrise/web-ui/lib/Select/Select';
import type { MessageDescriptor } from 'react-intl';
import { defineMessages } from 'react-intl';

import type {
  BackgroundOptions,
  Color,
  Fonts,
  FontShadows, FontSize,
  StyleOption, Toggle,
  WebFontSizes,
} from 'common/types/captionSettings';

export const BASIC_COLORS: Color[] = [
  {
    title: 'White',
    value: '255, 255, 255',
  },
  {
    title: 'Black',
    value: '0, 0, 0',
  },
  {
    title: 'Red',
    value: '255, 0, 0',
  },
  {
    title: 'Green',
    value: '0, 128, 0',
  },
  {
    title: 'Blue',
    value: '0, 0, 255',
  },
  {
    title: 'Yellow',
    value: '255, 255, 0',
  },
  {
    title: 'Magenta',
    value: '255, 0, 255',
  },
  {
    title: 'Cyan',
    value: '0, 255, 255',
  },
];

const webShadowMessages = defineMessages({
  dropShadow: {
    description: 'label for drop shadow option',
    defaultMessage: 'Drop Shadow',
  },
  raisedShadow: {
    description: 'label for raised shadow option',
    defaultMessage: 'Raised',
  },
  depressedShadow: {
    description: 'label for depressed shadow option',
    defaultMessage: 'Depressed',
  },
  uniformShadow: {
    description: 'label for uniform shadow option',
    defaultMessage: 'Uniform',
  },
  none: {
    description: 'label for no shadow option',
    defaultMessage: 'None',
  },
});

export const webFontShadowStaticMessages: { [key: string]: MessageDescriptor } = {
  drop: webShadowMessages.dropShadow,
  raised: webShadowMessages.raisedShadow,
  depressed: webShadowMessages.depressedShadow,
  uniform: webShadowMessages.uniformShadow,
  none: webShadowMessages.none,
};

export const WEB_FONT_SHADOW_STYLINGS: FontShadows = {
  drop: {
    value: 'drop',
    label: 'Drop Shadow',
    optionStyle: {
      textShadow: '1px 1px 1px rgb(0, 0, 0)',
    },
  },
  raised: {
    value: 'raised',
    label: 'Raised',
    optionStyle: {
      textShadow: '0 -1px 0 rgb(255, 255, 255), 0 1px 0 rgb(0, 0, 0)',
    },
  },
  depressed: {
    value: 'depressed',
    label: 'Depressed',
    optionStyle: {
      textShadow: '0 -1px 0 rgb(0, 0, 0), 0 1px 0 rgb(255, 255, 255)',
    },
  },
  uniform: {
    value: 'uniform',
    label: 'Uniform',
    optionStyle: {
      textShadow: `
      -1px 1px 0 rgb(0, 0, 0),
      1px -1px 0 rgb(0, 0, 0),
      1px 1px 0 rgb(0, 0, 0),
      -1px -1px 0 rgb(0, 0, 0),
      `,
    },
  },
  none: {
    value: 'none',
    label: 'None',
  },
};

export const WEB_FONT_SHADOW_STYLINGS_ARRAY: StyleOption[] = Object.values(WEB_FONT_SHADOW_STYLINGS);

const webFontMessages = defineMessages({
  block: {
    description: 'label for block option',
    defaultMessage: 'Block',
  },
  typewriter: {
    description: 'label for typewriter option',
    defaultMessage: 'Typewriter',
  },
  print: {
    description: 'label for print option',
    defaultMessage: 'Print',
  },
  console: {
    description: 'label for console option',
    defaultMessage: 'Console',
  },
  casual: {
    description: 'label for casual option',
    defaultMessage: 'Casual',
  },
  cursive: {
    description: 'label for cursive option',
    defaultMessage: 'Cursive',
  },
  smallcaps: {
    description: 'label for smallcaps option',
    defaultMessage: 'Small Caps',
  },
});

export const webFontStaticMessages: { [key: string]: MessageDescriptor } = {
  block: webFontMessages.block,
  typewriter: webFontMessages.typewriter,
  print: webFontMessages.print,
  console: webFontMessages.console,
  casual: webFontMessages.casual,
  cursive: webFontMessages.cursive,
  smallcaps: webFontMessages.smallcaps,
};

export const WEB_FONTS: Fonts = {
  block: {
    value: 'block',
    type: 'Helvetica Neue, Helvetica, Arial, sans-serif',
    label: 'Block',
    optionStyle: {
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    },
  },
  typewriter: {
    value: 'typewriter',
    type: 'Courier New, monospace',
    label: 'Typewriter',
    optionStyle: {
      fontFamily: 'Courier New, monospace',
    },
  },
  print: {
    value: 'print',
    type: 'Georgia, serif',
    label: 'Print',
    optionStyle: {
      fontFamily: 'Georgia, serif',
    },
  },
  console: {
    value: 'console',
    type: 'Lucida Console, Monaco, monospace',
    label: 'Console',
    optionStyle: {
      fontFamily: 'Lucida Console, Monaco, monospace',
    },
  },
  casual: {
    value: 'casual',
    type: 'Comic Sans MS, MarkerFelt-Thin, Roboto Italic, cursive',
    label: 'Casual',
    optionStyle: {
      fontFamily: 'Comic Sans MS, MarkerFelt-Thin, Roboto Italic, cursive',
    },
  },
  cursive: {
    value: 'cursive',
    type: 'Lucida Handwriting, Droid Serif Italic, cursive',
    label: 'Cursive',
    optionStyle: {
      fontFamily: 'Lucida Handwriting, Droid Serif Italic, cursive',
    },
  },
  smallcaps: {
    value: 'smallcaps',
    type: 'Helvetica Neue, Helvetica, sans-serif, sans-serif',
    label: 'Small Caps',
    variant: 'small-caps',
    optionStyle: {
      fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
    },
  },
};

export const WEB_FONT_OPTIONS_ARRAY: SelectOptions[] = Object.values(WEB_FONTS);

const webFontSizeMessages = defineMessages({
  small: {
    description: 'label for small font size toggle',
    defaultMessage: 'S',
  },
  medium: {
    description: 'label for medium font size toggle',
    defaultMessage: 'M',
  },
  large: {
    description: 'label for large font size toggle',
    defaultMessage: 'L',
  },
});

export const webFontSizeStaticMessages: { [key: string]: MessageDescriptor } = {
  small: webFontSizeMessages.small,
  medium: webFontSizeMessages.medium,
  large: webFontSizeMessages.large,
};

export const WEB_FONT_SIZE_OPTIONS: WebFontSizes = {
  small: {
    label: 'Small',
    vw: 'clamp(20px, 1.6vw, 60px)',
    value: 'small',
  },
  medium: {
    label: 'Medium',
    vw: 'clamp(25px, 2.5vw, 65px)',
    value: 'medium',
  },
  large: {
    label: 'Large',
    vw: 'clamp(30px, 3.4vw, 70px)',
    value: 'large',
  },
};

export const WEB_MINI_PLAYER_FONT_SIZE_OPTIONS: WebFontSizes = {
  small: {
    label: 'Small',
    vw: '14px',
    value: 'small',
  },
  medium: {
    label: 'Medium',
    vw: '16px',
    value: 'medium',
  },
  large: {
    label: 'Large',
    vw: '20px',
    value: 'large',
  },
};

export const inverseWebFontSizeStaticMessages: { [key: string]: string } = (() => {
  return Object.keys(webFontSizeStaticMessages).reduce((prev, curr) => {
    prev[webFontSizeStaticMessages[curr].defaultMessage as string] = WEB_FONT_SIZE_OPTIONS[curr].label;
    return prev;
  }, {});
})();

export const WEB_MOBILE_FONT_SIZE_OPTIONS: WebFontSizes = {
  small: {
    label: 'Small',
    vw: '12px',
    value: 'small',
    lineHeight: '16px',
  },
  medium: {
    label: 'Medium',
    vw: '16px',
    value: 'medium',
    lineHeight: '20px',
  },
};

export const WEB_CAPTION_BACKGROUND_COLOR = '16, 20, 31'; // light black
export const WEB_CAPTION_BACKGROUND_OPACITY = 0.8;

export const WEB_FONT_SIZE_OPTIONS_ARRAY: FontSize[] = Object.values(WEB_FONT_SIZE_OPTIONS);
export const WEB_MINI_PLAYER_FONT_SIZE_OPTIONS_ARRAY: FontSize[] = Object.values(WEB_MINI_PLAYER_FONT_SIZE_OPTIONS);

const webFontBackgroundMessages = defineMessages({
  off: {
    description: 'label for off button toggle',
    defaultMessage: 'Off',
  },
  on: {
    description: 'label for on button toggle',
    defaultMessage: 'On',
  },
});

export const webFontBackgroundStaticMessages: { [key: string]: MessageDescriptor } = {
  off: webFontBackgroundMessages.off,
  on: webFontBackgroundMessages.on,
};

export const WEB_BACKGROUND_OPTIONS: BackgroundOptions = {
  off: {
    label: 'Off',
    active: false,
    value: 'off',
  },
  on: {
    label: 'On',
    active: true,
    value: 'on',
  },
};

export const WEB_BACKGROUND_OPTIONS_ARRAY: Toggle[] = Object.values(WEB_BACKGROUND_OPTIONS);
