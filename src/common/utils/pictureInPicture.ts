export function isPictureInPictureSupported(): boolean {
  if (typeof document === 'undefined') return false;
  if ('pictureInPictureEnabled' in document) {
    return document.pictureInPictureEnabled;
  }
  return false;
}

export function isPictureInPictureEnabled(): boolean {
  if (typeof document === 'undefined') return false;
  if ('pictureInPictureElement' in document) {
    return !!document.pictureInPictureElement;
  }
  return false;
}

export function exitPictureInPicture(): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve();
  if (isPictureInPictureEnabled()) {
    return document.exitPictureInPicture();
  }
  /* istanbul ignore next */
  return Promise.resolve();
}
