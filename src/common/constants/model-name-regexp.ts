const ANDROIDTV_REGEXP = /Android\s[\d.]+;\s(.*)\sBuild\//;

/**
 * These RegExp used to match the model name form userAgent
 * eg:
 * on ANDROIDTV platform,
 * if the userAgent = `Mozilla/5.0 (Linux; Android 7.1.2; AFTMM Build/NS6276; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/84.0.4147.111 Mobile Safari/537.36`,
 * so the model name matched is `AFTMM`.
 */
export const ModelNameRegExp: Record<string, RegExp> = {
  VIZIO: /\sModel\/([A-Z]{1}[0-9a-z]{2,}-[A-Z]{1}[0-9]{1})\)/,
  VERIZONTV: /Model\/([A-Z0-9-]+)/,
};
__ANDROIDTV_HYB_PLATFORMS__.forEach(platform => {
  ModelNameRegExp[platform] = ANDROIDTV_REGEXP;
});
