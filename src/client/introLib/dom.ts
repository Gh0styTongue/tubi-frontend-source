export function clearVideoElement(videoElem?: HTMLVideoElement, reserveVideoElement: boolean = false) {
  if (videoElem instanceof HTMLVideoElement) {
    videoElem.pause();
    videoElem.removeAttribute('src'); // empty source
    videoElem.innerHTML = ''; // empty source elements
    videoElem.load();
    /* istanbul ignore next: ignore optional chaining */
    if (reserveVideoElement) return;
    videoElem.parentElement?.removeChild(videoElem);
  }
}
