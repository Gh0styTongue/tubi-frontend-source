export function formatBytes(bytes: number, decimals: number = 2): string {
  if (typeof bytes !== 'number' || bytes <= 0) return '0 Bytes';

  const k = 1024;
  const dm = Math.max(0, decimals);
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / (k ** i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatBitrate(bitrate: number, decimals: number = 2): string {
  if (typeof bitrate !== 'number' || bitrate <= 0) return '0 bps';

  const k = 1024;
  const dm = Math.max(0, decimals);
  const units = ['bps', 'Kbps', 'Mbps', 'Gbps', 'Tbps', 'Pbps', 'Ebps', 'Zbps', 'Ybps'];

  const i = Math.floor(Math.log(bitrate) / Math.log(k));

  return `${parseFloat((bitrate / (k ** i)).toFixed(dm))} ${units[i]}`;
}

interface FormatListOptions {
  /**
   * Whether to include a comma before the last item in a list.
   * @default true
   */
  useOxfordComma: boolean;
  /**
   * Whether to add "and" before the final item. Implies `useSpaces: true`.
   * @default true
   */
  useAnd: boolean;
  /**
   * Whether to add a space after the separators. Forced to `true` if `useAnd: true`.
   * @default true
   */
  useSpaces: boolean;
  /**
   * The separator character to use. Defaults to a comma.
   * @default ','
   */
  separator: string;
  /**
   * Use a different word for "and". Useful to support non-English languages.
   * @default 'and'
   */
  wordAnd: string;
}

const defaultOptions: FormatListOptions = {
  useOxfordComma: true,
  useAnd: true,
  useSpaces: true,
  separator: ',',
  wordAnd: 'and',
};

export function formatList(items: string[], options: Partial<FormatListOptions> = defaultOptions): string {
  const { useOxfordComma = true, useSpaces = true, separator = ',', wordAnd = 'and' } = options;
  const len = items.length;
  const space = useSpaces || options.useAnd ? ' ' : '';
  const and = options.useAnd === true || (options.useAnd == null && options.useSpaces !== false) ? wordAnd : '';
  const lastCommaIndex = useOxfordComma && len > 2 ? len - 2 : len - 3;
  const lastIndex = len - 1;
  return items.map((item, index): string => {
    return [
      index === lastIndex && len > 1 ? `${and}${space}` : '',
      item,
      index <= lastCommaIndex ? separator : '',
      index < lastIndex ? space : '',
    ].join('');
  }).join('');
}

const toFixed = (fixed: number, num: number): number => {
  return Number(num.toFixed(fixed));
};
export const toFixed2 = toFixed.bind(null, 2);

export const capitalizeFirstLetter = (str: string = ''): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

