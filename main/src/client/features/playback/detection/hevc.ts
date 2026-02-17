function getMediaSource(): typeof MediaSource | undefined {
  return self.MediaSource || ((self as any).WebKitMediaSource as MediaSource);
}

interface HEVCCodec {
  level: HEVC_LEVEL,
  dimension: string,
  codec: string
}

export const enum HEVC_LEVEL {
  L3 = 3,
  L3_1 = 3.1,
  L4 = 4,
  L4_1 = 4.1,
  L5 = 5,
}

export const HEVCLadder: HEVCCodec[] = [
  { level: HEVC_LEVEL.L5, dimension: '3840x2160', codec: 'hvc1.1.6.L153.B0' },
  { level: HEVC_LEVEL.L4_1, dimension: '1920x1080', codec: 'hvc1.1.6.L123.B0' },
  { level: HEVC_LEVEL.L4, dimension: '1024x576', codec: 'hvc1.1.6.L120.B0' },
  { level: HEVC_LEVEL.L3_1, dimension: '854x480', codec: 'hvc1.1.6.L93.B0' },
  { level: HEVC_LEVEL.L3, dimension: '640x360', codec: 'hvc1.1.6.L90.B0' },
];

/* istanbul ignore next */
export const doesMSESupportCodec = (codec: string): boolean => {
  const mediaSource = getMediaSource();
  return !!mediaSource
        && typeof mediaSource.isTypeSupported === 'function'
        && mediaSource.isTypeSupported(`video/mp4; codecs="${codec}"`);
};

export const supportHEVC = (): boolean => {
  // In the collected online data, doesMSESupportCodec returns same result for all these codec
  // so we take one for the check
  const codec = HEVCLadder[0].codec;
  return doesMSESupportCodec(codec);
};

export const supportVideoElementHEVC = (level: HEVC_LEVEL): boolean => {
  const codec = HEVCLadder.find(item => item.level === level)?.codec;
  if (!codec) {
    return false;
  }
  return !!document.createElement('video').canPlayType(`video/mp4;codecs="${codec}"`);
};
