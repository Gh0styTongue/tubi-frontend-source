function getMediaSource(): typeof MediaSource | undefined {
  return self.MediaSource || ((self as any).WebKitMediaSource as MediaSource);
}

function checkMp2tSupport() {
  const mediaSource = getMediaSource();
  return !!mediaSource
    && typeof mediaSource.isTypeSupported === 'function'
    && mediaSource.isTypeSupported('video/mp2t; codecs="avc1.42E01E,mp4a.40.2"');
}

export default checkMp2tSupport;
