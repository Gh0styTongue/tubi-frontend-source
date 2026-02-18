import { loadScript, appendInlineScript } from 'common/utils/dom';
import config from 'src/config';

import { ThirdPartyScript } from './thirdPartyScript';

const RESOURCE = `https://www.googletagmanager.com/gtag/js?id=${config.ga4MeasurementId}`;
/* istanbul ignore next */
const INLINE_CONTENT = `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${config.ga4MeasurementId}', { debug_mode: ${Boolean(__DEVELOPMENT__ || __STAGING__)} });
`;

class GA4 extends ThirdPartyScript {
  name = 'ga4';

  protected load() {
    loadScript(RESOURCE);
    appendInlineScript(INLINE_CONTENT);
  }

  disable() {
    /* istanbul ignore next */
    window.gtag?.('config', config.ga4MeasurementId, { send_page_view: false });
  }

  loadAndInit() {
    if (!window.gtag) {
      this.load();
    }
    window.gtag('config', config.ga4MeasurementId, { send_page_view: true });
    window.gtag('set', 'user_properties', {
      device_pixel_ratio: window.devicePixelRatio,
    });
  }

  onCoppaCompliant() {
    this.loadAndInit();
  }

  onCoppaNotCompliant() {
    /* istanbul ignore next */
    this.disable();
  }
}

export default GA4;
