export type ImageRefs = Record<string, HTMLImageElement>;

const _preloadImageHandler = {
  preloadImages(imageUrls: string[] | string, timeout: number) {
    const images: string[] = ([] as string[]).concat(imageUrls).filter(Boolean); // convert to array and remove falsy values
    const imgElemRefs: ImageRefs = {};
    if (!images.length) {
      return { promise: Promise.resolve(true), imgElemRefs };
    }
    const touchedImages = [];
    const promise: Promise<boolean> = new Promise((resolve) => {
      // resolve if loading takes too long
      const timer = setTimeout(() => resolve(true), timeout);
      const onLoadOrError = (url: string) => {
        touchedImages.push(url);
        delete imgElemRefs[url];
        if (touchedImages.length === images.length) {
          clearTimeout(timer);
          resolve(true);
        }
      };

      images.forEach((url) => {
        const bg = new Image();
        bg.src = url;
        imgElemRefs[url] = bg;
        bg.onload = () => onLoadOrError(url);
        bg.onerror = () => onLoadOrError(url);
      });
    });
    return {
      promise,
      imgElemRefs,
    };
  },
  abortPendingImageRequests(imgElemRefs: ImageRefs) {
    Object.values(imgElemRefs).forEach((img) => img.src = '');
  },
};

/**
 * useful for loading array of images up front and firing some response after promise resolves
 * @param imageUrls - array of image/s you want to load, or a single image URL
 * @param timeout - if images do not load after 5 seconds, bail and resolve
 * @returns {Promise<boolean>}
 */
export const preloadImages = (imageUrls: string[] | string = [], timeout: number = 5000):
  ReturnType<typeof _preloadImageHandler.preloadImages>['promise'] => {
  return _preloadImageHandler.preloadImages(imageUrls, timeout).promise;
};

/**
 * Return a promise to load images, will always complete. Will try to abort loading images
 * the returned abort function is called.
 * @param imageUrls - array of image/s you want to load, or a single image URL
 * @param timeout - if images do not load after 5 seconds, bail and resolve
 */
export function abortablePreloadImages(imageUrls: string[] | string, timeout: number = 5000): {
  abort: () => void;
  promise: Promise<boolean>;
  imgElemRefs: ImageRefs;
} {
  let shouldResetImageSrc = true;

  const {
    promise,
    imgElemRefs,
  } = _preloadImageHandler.preloadImages(imageUrls, timeout);

  function abort() {
    if (shouldResetImageSrc && imgElemRefs) {
      _preloadImageHandler.abortPendingImageRequests(imgElemRefs);
    }
  }

  return {
    abort,
    promise: promise.then(result => {
      shouldResetImageSrc = false;
      return result;
    }),
    imgElemRefs,
  };
}
