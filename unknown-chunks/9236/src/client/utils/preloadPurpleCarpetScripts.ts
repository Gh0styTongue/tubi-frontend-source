import { purpleCarpetScriptsPrefix } from 'common/apiConfig';

export function preloadPurplescripts() {
  // If the window object already has the wpf object, then the script is already loaded
  if (window.wpf) {
    return;
  }

  const existingLinks = Array.from(document.head.querySelectorAll('link[rel="preload"][as="script"]')) as HTMLLinkElement[];
  const isScriptAlreadyPreloaded = (src: string) => existingLinks.some(link => link.href === src);
  if (!['FIRETV_HYB', 'ANDROIDTV'].includes(__OTTPLATFORM__) || __WEBPLATFORM__ === 'WEB') {
    const scripts = [
      `${purpleCarpetScriptsPrefix}/wpf_player.js`,
      `${purpleCarpetScriptsPrefix}/lib/wpf_conviva_reporter.js`,
      `${purpleCarpetScriptsPrefix}/lib/wpf_mux_reporter.js`,
    ];

    if (__OTTPLATFORM__ === 'TIZEN') {
      scripts.push(`${purpleCarpetScriptsPrefix}/lib/wpf_tizen_plugin.js`);
    } else if (__OTTPLATFORM__ === 'LGTV') {
      scripts.push(`${purpleCarpetScriptsPrefix}/lib/wpf_webos_plugin.js`);
    }

    scripts.forEach(src => {
      // detect the preload link is already added to the head
      if (isScriptAlreadyPreloaded(src)) {
        return;
      }
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'script';
      link.href = src;
      document.head.appendChild(link);
    });
  }
}
