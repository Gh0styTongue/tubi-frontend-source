export const getMediaErrorMessage = (videoElement?: HTMLVideoElement) => {
  const error = videoElement?.error;
  let message = 'UNKNOWN_ERROR';
  if (error) {
    const codeStr = [
      'MEDIA_ERR_ABORTED',
      'MEDIA_ERR_DECODE',
      'MEDIA_ERR_NETWORK',
      'MEDIA_ERR_SRC_NOT_SUPPORTED',
    ].find(codeConstant => window.MediaError && window.MediaError[codeConstant] === error.code);
    message = `[${codeStr || message}] ${error.message || ''}`.trim();
  }
  return message;
};
