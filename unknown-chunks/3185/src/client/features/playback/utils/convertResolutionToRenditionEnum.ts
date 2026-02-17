export const enum Rendition {
  RENDITION_UNKNOWN = '1x1@1Kbps',
  RENDITION_240P = '426x240@500Kbps',
  RENDITION_360P = '640x360@700Kbps',
  RENDITION_480P = '854x480@1.5Mbps',
  RENDITION_576P = '1024x576@2Mbps',
  RENDITION_720P = '1280x720@3Mbps',
  RENDITION_1080P = '1920x1080@5Mbps',
  RENDITION_2160P = '3840x2160@10Mbps',
}

const RESOLUTION_16_9 = [
  {
    width: 426.6,
    height: 240,
    rendition: Rendition.RENDITION_240P,
  },
  {
    width: 640,
    height: 360,
    rendition: Rendition.RENDITION_360P,
  },
  {
    width: 853.3,
    height: 480,
    rendition: Rendition.RENDITION_480P,
  },
  {
    width: 1024,
    height: 576,
    rendition: Rendition.RENDITION_576P,
  },
  {
    width: 1280,
    height: 720,
    rendition: Rendition.RENDITION_720P,
  },
  {
    width: 1920,
    height: 1080,
    rendition: Rendition.RENDITION_1080P,
  },
  {
    width: 3840,
    height: 2160,
    rendition: Rendition.RENDITION_2160P,
  },
];

// 4:3 in CIW (Constant Image Width) format
const RESOLUTION_4_3 = [
  {
    width: 426.6,
    height: 320,
    rendition: Rendition.RENDITION_240P,
  },
  {
    width: 640,
    height: 480,
    rendition: Rendition.RENDITION_360P,
  },
  {
    width: 853.3,
    height: 640,
    rendition: Rendition.RENDITION_480P,
  },
  {
    width: 1024,
    height: 768,
    rendition: Rendition.RENDITION_576P,
  },
  {
    width: 1280,
    height: 960,
    rendition: Rendition.RENDITION_720P,
  },
  {
    width: 1920,
    height: 1440,
    rendition: Rendition.RENDITION_1080P,
  },
  {
    width: 3840,
    height: 2880,
    rendition: Rendition.RENDITION_2160P,
  },
];

export const convertResolutionToRenditionEnum = (contentId: string, resolution?: number[]): Rendition => {
  const [width, height] = resolution ?? [];
  if (!width || !height) return Rendition.RENDITION_UNKNOWN;

  const ratio = width / height;
  const fullResolutionList = [
    {
      ratio: 16 / 9,
      resolutions: RESOLUTION_16_9,
    },
    {
      ratio: 4 / 3,
      resolutions: RESOLUTION_4_3,
    },
  ];
  let result = Rendition.RENDITION_UNKNOWN;
  fullResolutionList.forEach((res) => {
    if (ratio > 0.99 * res.ratio && ratio < 1.01 * res.ratio) {
      res.resolutions.forEach((resolution) => {
        if (width > 0.99 * resolution.width && width < 1.01 * resolution.width) {
          result = resolution.rendition;
        }
      });
    }
  });
  return result;
};
