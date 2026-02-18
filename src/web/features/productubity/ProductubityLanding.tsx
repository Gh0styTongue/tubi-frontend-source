/* eslint-disable react/jsx-no-literals */
/* istanbul ignore file */
import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useIntl } from 'react-intl';
import type { IntlShape } from 'react-intl';

import { WEB_ROUTES } from 'common/constants/routes';
import {
  getCanonicalLink,
  getCanonicalMetaByLink,
} from 'web/features/seo/utils/seo';

const getMeta = (_intl: IntlShape) => {
  const description = 'Toggle between your Tubi stream and a faux-work article with one click. Sneak in a show, save your spot, and switch back when the coast is clear.';
  const canonical = getCanonicalLink(WEB_ROUTES.productubity);
  const title = 'Productubity by Tubi — Look Busy, Stream Easy';
  return {
    title,
    link: [
      getCanonicalMetaByLink(canonical),
    ],
    meta: [
      {
        name: 'keywords',
        content: 'Tubi, Productubity, Chrome extension, stream at work, free movies, free TV, streaming, productivity, business article, video streaming, watch at work, disguise streaming, Tubi extension',
      },
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:url', content: canonical },
      { property: 'og:description', content: description },
      { property: 'og:image', content: 'https://mcdn.tubitv.com/tubitv-assets/img/landing-page/icon_share.jpg' },
      { property: 'og:image:height', content: '1080' },
      { property: 'og:image:width', content: '1080' },
      { property: 'twitter:title', content: title },
      { property: 'twitter:description', content: description },
    ],
  };
};

const ProductubityLanding = () => {
  const intl = useIntl();
  useEffect(() => {
    try {
      (window as any).AOS.init({
        duration: 600,
        easing: 'ease-out-cubic',
        once: true,
        offset: 50,
        delay: 0,
      });
    } catch (_err) {
      const elements = document.querySelectorAll('[data-aos]');
      elements.forEach((el) => {
        (el as HTMLElement).style.opacity = '1';
      });
    }

  }, []);

  return (
    <div suppressHydrationWarning className="body">
      <Helmet {...getMeta(intl)} />
      <div suppressHydrationWarning className="wrapper">
        <style dangerouslySetInnerHTML={{ __html: `
        /* AOS CSS */
        [data-aos][data-aos][data-aos-duration="50"],body[data-aos-duration="50"] [data-aos]{transition-duration:50ms}[data-aos][data-aos][data-aos-delay="50"],body[data-aos-delay="50"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="50"].aos-animate,body[data-aos-delay="50"] [data-aos].aos-animate{transition-delay:50ms}[data-aos][data-aos][data-aos-duration="100"],body[data-aos-duration="100"] [data-aos]{transition-duration:.1s}[data-aos][data-aos][data-aos-delay="100"],body[data-aos-delay="100"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="100"].aos-animate,body[data-aos-delay="100"] [data-aos].aos-animate{transition-delay:.1s}[data-aos][data-aos][data-aos-duration="150"],body[data-aos-duration="150"] [data-aos]{transition-duration:.15s}[data-aos][data-aos][data-aos-delay="150"],body[data-aos-delay="150"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="150"].aos-animate,body[data-aos-delay="150"] [data-aos].aos-animate{transition-delay:.15s}[data-aos][data-aos][data-aos-duration="200"],body[data-aos-duration="200"] [data-aos]{transition-duration:.2s}[data-aos][data-aos][data-aos-delay="200"],body[data-aos-delay="200"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="200"].aos-animate,body[data-aos-delay="200"] [data-aos].aos-animate{transition-delay:.2s}[data-aos][data-aos][data-aos-duration="250"],body[data-aos-duration="250"] [data-aos]{transition-duration:.25s}[data-aos][data-aos][data-aos-delay="250"],body[data-aos-delay="250"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="250"].aos-animate,body[data-aos-delay="250"] [data-aos].aos-animate{transition-delay:.25s}[data-aos][data-aos][data-aos-duration="300"],body[data-aos-duration="300"] [data-aos]{transition-duration:.3s}[data-aos][data-aos][data-aos-delay="300"],body[data-aos-delay="300"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="300"].aos-animate,body[data-aos-delay="300"] [data-aos].aos-animate{transition-delay:.3s}[data-aos][data-aos][data-aos-duration="350"],body[data-aos-duration="350"] [data-aos]{transition-duration:.35s}[data-aos][data-aos][data-aos-delay="350"],body[data-aos-delay="350"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="350"].aos-animate,body[data-aos-delay="350"] [data-aos].aos-animate{transition-delay:.35s}[data-aos][data-aos][data-aos-duration="400"],body[data-aos-duration="400"] [data-aos]{transition-duration:.4s}[data-aos][data-aos][data-aos-delay="400"],body[data-aos-delay="400"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="400"].aos-animate,body[data-aos-delay="400"] [data-aos].aos-animate{transition-delay:.4s}[data-aos][data-aos][data-aos-duration="450"],body[data-aos-duration="450"] [data-aos]{transition-duration:.45s}[data-aos][data-aos][data-aos-delay="450"],body[data-aos-delay="450"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="450"].aos-animate,body[data-aos-delay="450"] [data-aos].aos-animate{transition-delay:.45s}[data-aos][data-aos][data-aos-duration="500"],body[data-aos-duration="500"] [data-aos]{transition-duration:.5s}[data-aos][data-aos][data-aos-delay="500"],body[data-aos-delay="500"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="500"].aos-animate,body[data-aos-delay="500"] [data-aos].aos-animate{transition-delay:.5s}[data-aos][data-aos][data-aos-duration="550"],body[data-aos-duration="550"] [data-aos]{transition-duration:.55s}[data-aos][data-aos][data-aos-delay="550"],body[data-aos-delay="550"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="550"].aos-animate,body[data-aos-delay="550"] [data-aos].aos-animate{transition-delay:.55s}[data-aos][data-aos][data-aos-duration="600"],body[data-aos-duration="600"] [data-aos]{transition-duration:.6s}[data-aos][data-aos][data-aos-delay="600"],body[data-aos-delay="600"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="600"].aos-animate,body[data-aos-delay="600"] [data-aos].aos-animate{transition-delay:.6s}[data-aos][data-aos][data-aos-duration="650"],body[data-aos-duration="650"] [data-aos]{transition-duration:.65s}[data-aos][data-aos][data-aos-delay="650"],body[data-aos-delay="650"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="650"].aos-animate,body[data-aos-delay="650"] [data-aos].aos-animate{transition-delay:.65s}[data-aos][data-aos][data-aos-duration="700"],body[data-aos-duration="700"] [data-aos]{transition-duration:.7s}[data-aos][data-aos][data-aos-delay="700"],body[data-aos-delay="700"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="700"].aos-animate,body[data-aos-delay="700"] [data-aos].aos-animate{transition-delay:.7s}[data-aos][data-aos][data-aos-duration="750"],body[data-aos-duration="750"] [data-aos]{transition-duration:.75s}[data-aos][data-aos][data-aos-delay="750"],body[data-aos-delay="750"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="750"].aos-animate,body[data-aos-delay="750"] [data-aos].aos-animate{transition-delay:.75s}[data-aos][data-aos][data-aos-duration="800"],body[data-aos-duration="800"] [data-aos]{transition-duration:.8s}[data-aos][data-aos][data-aos-delay="800"],body[data-aos-delay="800"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="800"].aos-animate,body[data-aos-delay="800"] [data-aos].aos-animate{transition-delay:.8s}[data-aos][data-aos][data-aos-duration="850"],body[data-aos-duration="850"] [data-aos]{transition-duration:.85s}[data-aos][data-aos][data-aos-delay="850"],body[data-aos-delay="850"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="850"].aos-animate,body[data-aos-delay="850"] [data-aos].aos-animate{transition-delay:.85s}[data-aos][data-aos][data-aos-duration="900"],body[data-aos-duration="900"] [data-aos]{transition-duration:.9s}[data-aos][data-aos][data-aos-delay="900"],body[data-aos-delay="900"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="900"].aos-animate,body[data-aos-delay="900"] [data-aos].aos-animate{transition-delay:.9s}[data-aos][data-aos][data-aos-duration="950"],body[data-aos-duration="950"] [data-aos]{transition-duration:.95s}[data-aos][data-aos][data-aos-delay="950"],body[data-aos-delay="950"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="950"].aos-animate,body[data-aos-delay="950"] [data-aos].aos-animate{transition-delay:.95s}[data-aos][data-aos][data-aos-duration="1000"],body[data-aos-duration="1000"] [data-aos]{transition-duration:1s}[data-aos][data-aos][data-aos-delay="1000"],body[data-aos-delay="1000"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="1000"].aos-animate,body[data-aos-delay="1000"] [data-aos].aos-animate{transition-delay:1s}[data-aos][data-aos][data-aos-duration="1050"],body[data-aos-duration="1050"] [data-aos]{transition-duration:1.05s}[data-aos][data-aos][data-aos-delay="1050"],body[data-aos-delay="1050"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="1050"].aos-animate,body[data-aos-delay="1050"] [data-aos].aos-animate{transition-delay:1.05s}[data-aos][data-aos][data-aos-duration="1100"],body[data-aos-duration="1100"] [data-aos]{transition-duration:1.1s}[data-aos][data-aos][data-aos-delay="1100"],body[data-aos-delay="1100"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="1100"].aos-animate,body[data-aos-delay="1100"] [data-aos].aos-animate{transition-delay:1.1s}[data-aos][data-aos][data-aos-duration="1150"],body[data-aos-duration="1150"] [data-aos]{transition-duration:1.15s}[data-aos][data-aos][data-aos-delay="1150"],body[data-aos-delay="1150"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="1150"].aos-animate,body[data-aos-delay="1150"] [data-aos].aos-animate{transition-delay:1.15s}[data-aos][data-aos][data-aos-duration="1200"],body[data-aos-duration="1200"] [data-aos]{transition-duration:1.2s}[data-aos][data-aos][data-aos-delay="1200"],body[data-aos-delay="1200"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="1200"].aos-animate,body[data-aos-delay="1200"] [data-aos].aos-animate{transition-delay:1.2s}[data-aos][data-aos][data-aos-duration="1250"],body[data-aos-duration="1250"] [data-aos]{transition-duration:1.25s}[data-aos][data-aos][data-aos-delay="1250"],body[data-aos-delay="1250"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="1250"].aos-animate,body[data-aos-delay="1250"] [data-aos].aos-animate{transition-delay:1.25s}[data-aos][data-aos][data-aos-duration="1300"],body[data-aos-duration="1300"] [data-aos]{transition-duration:1.3s}[data-aos][data-aos][data-aos-delay="1300"],body[data-aos-delay="1300"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="1300"].aos-animate,body[data-aos-delay="1300"] [data-aos].aos-animate{transition-delay:1.3s}[data-aos][data-aos][data-aos-duration="1350"],body[data-aos-duration="1350"] [data-aos]{transition-duration:1.35s}[data-aos][data-aos][data-aos-delay="1350"],body[data-aos-delay="1350"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="1350"].aos-animate,body[data-aos-delay="1350"] [data-aos].aos-animate{transition-delay:1.35s}[data-aos][data-aos][data-aos-duration="1400"],body[data-aos-duration="1400"] [data-aos]{transition-duration:1.4s}[data-aos][data-aos][data-aos-delay="1400"],body[data-aos-delay="1400"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="1400"].aos-animate,body[data-aos-delay="1400"] [data-aos].aos-animate{transition-delay:1.4s}[data-aos][data-aos][data-aos-duration="1450"],body[data-aos-duration="1450"] [data-aos]{transition-duration:1.45s}[data-aos][data-aos][data-aos-delay="1450"],body[data-aos-delay="1450"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="1450"].aos-animate,body[data-aos-delay="1450"] [data-aos].aos-animate{transition-delay:1.45s}[data-aos][data-aos][data-aos-duration="1500"],body[data-aos-duration="1500"] [data-aos]{transition-duration:1.5s}[data-aos][data-aos][data-aos-delay="1500"],body[data-aos-delay="1500"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="1500"].aos-animate,body[data-aos-delay="1500"] [data-aos].aos-animate{transition-delay:1.5s}[data-aos][data-aos][data-aos-duration="1550"],body[data-aos-duration="1550"] [data-aos]{transition-duration:1.55s}[data-aos][data-aos][data-aos-delay="1550"],body[data-aos-delay="1550"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="1550"].aos-animate,body[data-aos-delay="1550"] [data-aos].aos-animate{transition-delay:1.55s}[data-aos][data-aos][data-aos-duration="1600"],body[data-aos-duration="1600"] [data-aos]{transition-duration:1.6s}[data-aos][data-aos][data-aos-delay="1600"],body[data-aos-delay="1600"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="1600"].aos-animate,body[data-aos-delay="1600"] [data-aos].aos-animate{transition-delay:1.6s}[data-aos][data-aos][data-aos-duration="1650"],body[data-aos-duration="1650"] [data-aos]{transition-duration:1.65s}[data-aos][data-aos][data-aos-delay="1650"],body[data-aos-delay="1650"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="1650"].aos-animate,body[data-aos-delay="1650"] [data-aos].aos-animate{transition-delay:1.65s}[data-aos][data-aos][data-aos-duration="1700"],body[data-aos-duration="1700"] [data-aos]{transition-duration:1.7s}[data-aos][data-aos][data-aos-delay="1700"],body[data-aos-delay="1700"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="1700"].aos-animate,body[data-aos-delay="1700"] [data-aos].aos-animate{transition-delay:1.7s}[data-aos][data-aos][data-aos-duration="1750"],body[data-aos-duration="1750"] [data-aos]{transition-duration:1.75s}[data-aos][data-aos][data-aos-delay="1750"],body[data-aos-delay="1750"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="1750"].aos-animate,body[data-aos-delay="1750"] [data-aos].aos-animate{transition-delay:1.75s}[data-aos][data-aos][data-aos-duration="1800"],body[data-aos-duration="1800"] [data-aos]{transition-duration:1.8s}[data-aos][data-aos][data-aos-delay="1800"],body[data-aos-delay="1800"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="1800"].aos-animate,body[data-aos-delay="1800"] [data-aos].aos-animate{transition-delay:1.8s}[data-aos][data-aos][data-aos-duration="1850"],body[data-aos-duration="1850"] [data-aos]{transition-duration:1.85s}[data-aos][data-aos][data-aos-delay="1850"],body[data-aos-delay="1850"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="1850"].aos-animate,body[data-aos-delay="1850"] [data-aos].aos-animate{transition-delay:1.85s}[data-aos][data-aos][data-aos-duration="1900"],body[data-aos-duration="1900"] [data-aos]{transition-duration:1.9s}[data-aos][data-aos][data-aos-delay="1900"],body[data-aos-delay="1900"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="1900"].aos-animate,body[data-aos-delay="1900"] [data-aos].aos-animate{transition-delay:1.9s}[data-aos][data-aos][data-aos-duration="1950"],body[data-aos-duration="1950"] [data-aos]{transition-duration:1.95s}[data-aos][data-aos][data-aos-delay="1950"],body[data-aos-delay="1950"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="1950"].aos-animate,body[data-aos-delay="1950"] [data-aos].aos-animate{transition-delay:1.95s}[data-aos][data-aos][data-aos-duration="2000"],body[data-aos-duration="2000"] [data-aos]{transition-duration:2s}[data-aos][data-aos][data-aos-delay="2000"],body[data-aos-delay="2000"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="2000"].aos-animate,body[data-aos-delay="2000"] [data-aos].aos-animate{transition-delay:2s}[data-aos][data-aos][data-aos-duration="2050"],body[data-aos-duration="2050"] [data-aos]{transition-duration:2.05s}[data-aos][data-aos][data-aos-delay="2050"],body[data-aos-delay="2050"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="2050"].aos-animate,body[data-aos-delay="2050"] [data-aos].aos-animate{transition-delay:2.05s}[data-aos][data-aos][data-aos-duration="2100"],body[data-aos-duration="2100"] [data-aos]{transition-duration:2.1s}[data-aos][data-aos][data-aos-delay="2100"],body[data-aos-delay="2100"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="2100"].aos-animate,body[data-aos-delay="2100"] [data-aos].aos-animate{transition-delay:2.1s}[data-aos][data-aos][data-aos-duration="2150"],body[data-aos-duration="2150"] [data-aos]{transition-duration:2.15s}[data-aos][data-aos][data-aos-delay="2150"],body[data-aos-delay="2150"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="2150"].aos-animate,body[data-aos-delay="2150"] [data-aos].aos-animate{transition-delay:2.15s}[data-aos][data-aos][data-aos-duration="2200"],body[data-aos-duration="2200"] [data-aos]{transition-duration:2.2s}[data-aos][data-aos][data-aos-delay="2200"],body[data-aos-delay="2200"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="2200"].aos-animate,body[data-aos-delay="2200"] [data-aos].aos-animate{transition-delay:2.2s}[data-aos][data-aos][data-aos-duration="2250"],body[data-aos-duration="2250"] [data-aos]{transition-duration:2.25s}[data-aos][data-aos][data-aos-delay="2250"],body[data-aos-delay="2250"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="2250"].aos-animate,body[data-aos-delay="2250"] [data-aos].aos-animate{transition-delay:2.25s}[data-aos][data-aos][data-aos-duration="2300"],body[data-aos-duration="2300"] [data-aos]{transition-duration:2.3s}[data-aos][data-aos][data-aos-delay="2300"],body[data-aos-delay="2300"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="2300"].aos-animate,body[data-aos-delay="2300"] [data-aos].aos-animate{transition-delay:2.3s}[data-aos][data-aos][data-aos-duration="2350"],body[data-aos-duration="2350"] [data-aos]{transition-duration:2.35s}[data-aos][data-aos][data-aos-delay="2350"],body[data-aos-delay="2350"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="2350"].aos-animate,body[data-aos-delay="2350"] [data-aos].aos-animate{transition-delay:2.35s}[data-aos][data-aos][data-aos-duration="2400"],body[data-aos-duration="2400"] [data-aos]{transition-duration:2.4s}[data-aos][data-aos][data-aos-delay="2400"],body[data-aos-delay="2400"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="2400"].aos-animate,body[data-aos-delay="2400"] [data-aos].aos-animate{transition-delay:2.4s}[data-aos][data-aos][data-aos-duration="2450"],body[data-aos-duration="2450"] [data-aos]{transition-duration:2.45s}[data-aos][data-aos][data-aos-delay="2450"],body[data-aos-delay="2450"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="2450"].aos-animate,body[data-aos-delay="2450"] [data-aos].aos-animate{transition-delay:2.45s}[data-aos][data-aos][data-aos-duration="2500"],body[data-aos-duration="2500"] [data-aos]{transition-duration:2.5s}[data-aos][data-aos][data-aos-delay="2500"],body[data-aos-delay="2500"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="2500"].aos-animate,body[data-aos-delay="2500"] [data-aos].aos-animate{transition-delay:2.5s}[data-aos][data-aos][data-aos-duration="2550"],body[data-aos-duration="2550"] [data-aos]{transition-duration:2.55s}[data-aos][data-aos][data-aos-delay="2550"],body[data-aos-delay="2550"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="2550"].aos-animate,body[data-aos-delay="2550"] [data-aos].aos-animate{transition-delay:2.55s}[data-aos][data-aos][data-aos-duration="2600"],body[data-aos-duration="2600"] [data-aos]{transition-duration:2.6s}[data-aos][data-aos][data-aos-delay="2600"],body[data-aos-delay="2600"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="2600"].aos-animate,body[data-aos-delay="2600"] [data-aos].aos-animate{transition-delay:2.6s}[data-aos][data-aos][data-aos-duration="2650"],body[data-aos-duration="2650"] [data-aos]{transition-duration:2.65s}[data-aos][data-aos][data-aos-delay="2650"],body[data-aos-delay="2650"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="2650"].aos-animate,body[data-aos-delay="2650"] [data-aos].aos-animate{transition-delay:2.65s}[data-aos][data-aos][data-aos-duration="2700"],body[data-aos-duration="2700"] [data-aos]{transition-duration:2.7s}[data-aos][data-aos][data-aos-delay="2700"],body[data-aos-delay="2700"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="2700"].aos-animate,body[data-aos-delay="2700"] [data-aos].aos-animate{transition-delay:2.7s}[data-aos][data-aos][data-aos-duration="2750"],body[data-aos-duration="2750"] [data-aos]{transition-duration:2.75s}[data-aos][data-aos][data-aos-delay="2750"],body[data-aos-delay="2750"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="2750"].aos-animate,body[data-aos-delay="2750"] [data-aos].aos-animate{transition-delay:2.75s}[data-aos][data-aos][data-aos-duration="2800"],body[data-aos-duration="2800"] [data-aos]{transition-duration:2.8s}[data-aos][data-aos][data-aos-delay="2800"],body[data-aos-delay="2800"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="2800"].aos-animate,body[data-aos-delay="2800"] [data-aos].aos-animate{transition-delay:2.8s}[data-aos][data-aos][data-aos-duration="2850"],body[data-aos-duration="2850"] [data-aos]{transition-duration:2.85s}[data-aos][data-aos][data-aos-delay="2850"],body[data-aos-delay="2850"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="2850"].aos-animate,body[data-aos-delay="2850"] [data-aos].aos-animate{transition-delay:2.85s}[data-aos][data-aos][data-aos-duration="2900"],body[data-aos-duration="2900"] [data-aos]{transition-duration:2.9s}[data-aos][data-aos][data-aos-delay="2900"],body[data-aos-delay="2900"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="2900"].aos-animate,body[data-aos-delay="2900"] [data-aos].aos-animate{transition-delay:2.9s}[data-aos][data-aos][data-aos-duration="2950"],body[data-aos-duration="2950"] [data-aos]{transition-duration:2.95s}[data-aos][data-aos][data-aos-delay="2950"],body[data-aos-delay="2950"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="2950"].aos-animate,body[data-aos-delay="2950"] [data-aos].aos-animate{transition-delay:2.95s}[data-aos][data-aos][data-aos-duration="3000"],body[data-aos-duration="3000"] [data-aos]{transition-duration:3s}[data-aos][data-aos][data-aos-delay="3000"],body[data-aos-delay="3000"] [data-aos]{transition-delay:0}[data-aos][data-aos][data-aos-delay="3000"].aos-animate,body[data-aos-delay="3000"] [data-aos].aos-animate{transition-delay:3s}[data-aos][data-aos][data-aos-easing=linear],body[data-aos-easing=linear] [data-aos]{transition-timing-function:cubic-bezier(.25,.25,.75,.75)}[data-aos][data-aos][data-aos-easing=ease],body[data-aos-easing=ease] [data-aos]{transition-timing-function:ease}[data-aos][data-aos][data-aos-easing=ease-in],body[data-aos-easing=ease-in] [data-aos]{transition-timing-function:ease-in}[data-aos][data-aos][data-aos-easing=ease-out],body[data-aos-easing=ease-out] [data-aos]{transition-timing-function:ease-out}[data-aos][data-aos][data-aos-easing=ease-in-out],body[data-aos-easing=ease-in-out] [data-aos]{transition-timing-function:ease-in-out}[data-aos][data-aos][data-aos-easing=ease-in-back],body[data-aos-easing=ease-in-back] [data-aos]{transition-timing-function:cubic-bezier(.6,-.28,.735,.045)}[data-aos][data-aos][data-aos-easing=ease-out-back],body[data-aos-easing=ease-out-back] [data-aos]{transition-timing-function:cubic-bezier(.175,.885,.32,1.275)}[data-aos][data-aos][data-aos-easing=ease-in-out-back],body[data-aos-easing=ease-in-out-back] [data-aos]{transition-timing-function:cubic-bezier(.68,-.55,.265,1.55)}[data-aos][data-aos][data-aos-easing=ease-in-sine],body[data-aos-easing=ease-in-sine] [data-aos]{transition-timing-function:cubic-bezier(.47,0,.745,.715)}[data-aos][data-aos][data-aos-easing=ease-out-sine],body[data-aos-easing=ease-out-sine] [data-aos]{transition-timing-function:cubic-bezier(.39,.575,.565,1)}[data-aos][data-aos][data-aos-easing=ease-in-out-sine],body[data-aos-easing=ease-in-out-sine] [data-aos]{transition-timing-function:cubic-bezier(.445,.05,.55,.95)}[data-aos][data-aos][data-aos-easing=ease-in-quad],body[data-aos-easing=ease-in-quad] [data-aos]{transition-timing-function:cubic-bezier(.55,.085,.68,.53)}[data-aos][data-aos][data-aos-easing=ease-out-quad],body[data-aos-easing=ease-out-quad] [data-aos]{transition-timing-function:cubic-bezier(.25,.46,.45,.94)}[data-aos][data-aos][data-aos-easing=ease-in-out-quad],body[data-aos-easing=ease-in-out-quad] [data-aos]{transition-timing-function:cubic-bezier(.455,.03,.515,.955)}[data-aos][data-aos][data-aos-easing=ease-in-cubic],body[data-aos-easing=ease-in-cubic] [data-aos]{transition-timing-function:cubic-bezier(.55,.085,.68,.53)}[data-aos][data-aos][data-aos-easing=ease-out-cubic],body[data-aos-easing=ease-out-cubic] [data-aos]{transition-timing-function:cubic-bezier(.25,.46,.45,.94)}[data-aos][data-aos][data-aos-easing=ease-in-out-cubic],body[data-aos-easing=ease-in-out-cubic] [data-aos]{transition-timing-function:cubic-bezier(.455,.03,.515,.955)}[data-aos][data-aos][data-aos-easing=ease-in-quart],body[data-aos-easing=ease-in-quart] [data-aos]{transition-timing-function:cubic-bezier(.55,.085,.68,.53)}[data-aos][data-aos][data-aos-easing=ease-out-quart],body[data-aos-easing=ease-out-quart] [data-aos]{transition-timing-function:cubic-bezier(.25,.46,.45,.94)}[data-aos][data-aos][data-aos-easing=ease-in-out-quart],body[data-aos-easing=ease-in-out-quart] [data-aos]{transition-timing-function:cubic-bezier(.455,.03,.515,.955)}[data-aos^=fade][data-aos^=fade]{opacity:0;transition-property:opacity,transform}[data-aos^=fade][data-aos^=fade].aos-animate{opacity:1;transform:translateZ(0)}[data-aos=fade-up]{transform:translate3d(0,100px,0)}[data-aos=fade-down]{transform:translate3d(0,-100px,0)}[data-aos=fade-right]{transform:translate3d(-100px,0,0)}[data-aos=fade-left]{transform:translate3d(100px,0,0)}[data-aos=fade-up-right]{transform:translate3d(-100px,100px,0)}[data-aos=fade-up-left]{transform:translate3d(100px,100px,0)}[data-aos=fade-down-right]{transform:translate3d(-100px,-100px,0)}[data-aos=fade-down-left]{transform:translate3d(100px,-100px,0)}[data-aos^=zoom][data-aos^=zoom]{opacity:0;transition-property:opacity,transform}[data-aos^=zoom][data-aos^=zoom].aos-animate{opacity:1;transform:translateZ(0) scale(1)}[data-aos=zoom-in]{transform:scale(.6)}[data-aos=zoom-in-up]{transform:translate3d(0,100px,0) scale(.6)}[data-aos=zoom-in-down]{transform:translate3d(0,-100px,0) scale(.6)}[data-aos=zoom-in-right]{transform:translate3d(-100px,0,0) scale(.6)}[data-aos=zoom-in-left]{transform:translate3d(100px,0,0) scale(.6)}[data-aos=zoom-out]{transform:scale(1.2)}[data-aos=zoom-out-up]{transform:translate3d(0,100px,0) scale(1.2)}[data-aos=zoom-out-down]{transform:translate3d(0,-100px,0) scale(1.2)}[data-aos=zoom-out-right]{transform:translate3d(-100px,0,0) scale(1.2)}[data-aos=zoom-out-left]{transform:translate3d(100px,0,0) scale(1.2)}[data-aos^=slide][data-aos^=slide]{transition-property:transform}[data-aos^=slide][data-aos^=slide].aos-animate{transform:translateZ(0)}[data-aos=slide-up]{transform:translate3d(0,100%,0)}[data-aos=slide-down]{transform:translate3d(0,-100%,0)}[data-aos=slide-right]{transform:translate3d(-100%,0,0)}[data-aos=slide-left]{transform:translate3d(100%,0,0)}[data-aos^=flip][data-aos^=flip]{backface-visibility:hidden;transition-property:transform}[data-aos=flip-left]{transform:perspective(2500px) rotateY(-100deg)}[data-aos=flip-left].aos-animate{transform:perspective(2500px) rotateY(0)}[data-aos=flip-right]{transform:perspective(2500px) rotateY(100deg)}[data-aos=flip-right].aos-animate{transform:perspective(2500px) rotateY(0)}[data-aos=flip-up]{transform:perspective(2500px) rotateX(-100deg)}[data-aos=flip-up].aos-animate{transform:perspective(2500px) rotateX(0)}[data-aos=flip-down]{transform:perspective(2500px) rotateX(100deg)}[data-aos=flip-down].aos-animate{transform:perspective(2500px) rotateX(0)}


        /* Google Fonts - Inter */
        @import url("https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,100..900&display=swap");
        
        @font-face {
          font-family: "TubiStans-Black";
          src: url("https://mcdn.tubitv.com/tubitv-assets/fonts/TubiStans-Black.woff2") format("woff2"),
            url("https://mcdn.tubitv.com/tubitv-assets/fonts/TubiStans-Black.woff") format("woff");
          font-weight: normal;
          font-style: normal;
        }
        
        :root {
          --purple: #45009d;
          --purple: color(display-p3 0.27 0 0.61);
          --yellow: ffff13;
          --yellow: color(display-p3 1 1 0.075);
          scroll-behavior: smooth;
        }
        
        span[data-aos="fade-up"] {
          transform: translate3d(0, 3rem, 0);
        }
        
        * {
          margin: 0;
          padding: 0;
        }
        
        *,
        *::before,
        *::after {
          box-sizing: border-box;
        }
        
        .body {
          height: 100%;
          background: url("https://mcdn.tubitv.com/tubitv-assets/img/landing-page/bg-bottom.webp") 0 100%/100% auto no-repeat,
            url("https://mcdn.tubitv.com/tubitv-assets/img/landing-page/bubble_left.jpg") 0 30%/393px auto no-repeat,
            url("https://mcdn.tubitv.com/tubitv-assets/img/landing-page/bubble_right.jpg") 100% 60%/333px auto no-repeat,
            var(--purple) url("https://mcdn.tubitv.com/tubitv-assets/img/landing-page/purple.jpg");
          color: white;
          cursor: default;
          font-family: "Inter", sans-serif;
          font-optical-sizing: auto;
          font-weight: 400;
          font-style: normal;
          line-height: 1.6;
          text-align: center;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        
          @media (min-width: 1600px) {
            background: url("https://mcdn.tubitv.com/tubitv-assets/img/landing-page/bg-bottom.webp") 0 100%/100% auto no-repeat,
              url("https://mcdn.tubitv.com/tubitv-assets/img/landing-page/bubble_left.jpg") 0 30%/393px auto no-repeat,
              var(--purple) url("https://mcdn.tubitv.com/tubitv-assets/img/landing-page/purple.jpg");
          }
        
          @media (max-width: 767px) {
            background: url("https://mcdn.tubitv.com/tubitv-assets/img/landing-page/bg-bottom.webp") 0 100%/100% auto no-repeat,
              url("https://mcdn.tubitv.com/tubitv-assets/img/landing-page/bubble_left.jpg") 0 20%/262px auto no-repeat,
              url("https://mcdn.tubitv.com/tubitv-assets/img/landing-page/bubble_right.jpg") 100% 52%/222px auto no-repeat,
              var(--purple) url("https://mcdn.tubitv.com/tubitv-assets/img/landing-page/purple.jpg");
          }
        }
        
        h1,
        h2,
        h3 {
          color: var(--yellow);
          font-family: "TubiStans-Black", sans-serif;
          font-weight: normal;
          letter-spacing: -0.02em;
          line-height: 0.8em;
          text-transform: uppercase;
        
          a {
            color: white;
            border-bottom: 2px solid;
            display: inline-block;
            padding-bottom: 0.1em;
            transition: color 0.3s;
        
            &:hover {
              color: var(--yellow);
            }
          }
        
          span {
            display: block;
          }
        }
        
        h2 {
          font-size: 4em;
        
          @media (max-width: 767px) {
            font-size: 2.5em;
          }
        }
        
        h3 {
          font-size: 2em;
        
          @media (max-width: 767px) {
            font-size: 1.5em;
          }
        }
        
        a {
          color: inherit;
          text-decoration: none;
        }
        
        img {
          display: block;
        }
        
        p {
          font-size: 1.1em;
          margin: 0 auto;
          max-width: 620px;
        
          @media (max-width: 767px) {
            font-size: 1em;
          }
        }
        
        .wrapper {
          font-size: 16px;
          margin: 0 auto;
          max-width: 1264px; /* 1200px + 4em */
          width: 100%;
          padding: 0 2em;
        
          @media (max-width: 767px) {
            overflow-x: hidden;
            padding: 0 1em;
            width: 100%;
          }
        }
        
        .header {
          align-items: center;
          display: flex;
          justify-content: space-between;
          padding: 2em 0;
        
          @media (max-width: 767px) {
            justify-content: center;
            padding: 1em 0;
        
            .add {
              display: none;
            }
          }
        
          h1 {
            width: 3em;
        
            @media (max-width: 767px) {
              width: 4em;
            }
          }
        
          img {
            width: 100%;
          }
        }
        
        .add {
          background: url("https://mcdn.tubitv.com/tubitv-assets/img/landing-page/switch.png") 100% 50% / auto 100% no-repeat;
          display: block;
          padding: 0.5em 0;
          text-align: left;
          transition: filter 0.3s;
          will-change: filter;
          width: 20.5em;
        
          @media (max-width: 767px) {
            width: 100%;
            max-width: 300px;
            background-size: auto 80%;
          }
        
          &:hover {
            filter: saturate(1.5);
          }
        }
        
        .add-wrapper {
          margin: 2em 0;
        
          .add {
            margin: 0 auto;
          }
        
          @media (max-width: 767px) {
            margin: 1.5em 0;
          }
        
          &:last-child {
            margin-bottom: 6rem;
        
            @media (max-width: 767px) {
              margin-bottom: 4rem;
            }
          }
        }
        
        .intro {
          margin: 2rem 0;
        
          @media (max-width: 767px) {
            font-size: 8vw;
            margin: 1.5rem 0;
          }
        }
        
        .video {
          aspect-ratio: 16 / 9;
          background: #fff;
          border-radius: 1em;
          cursor: pointer;
          overflow: hidden;
          width: 800px;
          margin: 2rem auto 4rem;
          filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.2));
          position: relative;
        
          @media (max-width: 767px) {
            width: 100%;
            margin: 1.5rem auto 3rem;
            border-radius: 0.5em;
          }
        }
        
        .video-thumb {
          opacity: 0.65;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: opacity 0.3s ease;
        }
        
        .video-embed {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }
        
        .video.playing .video-embed {
          opacity: 1;
          pointer-events: auto;
        }
        
        .video.playing .video-thumb,
        .video.playing:not(.paused) .play-button {
          opacity: 0;
          pointer-events: none;
        }
        
        .play-button {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 80px;
          height: 80px;
          z-index: 10;
          transition: transform 0.3s ease;
          filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3));
        }
        
        .video:hover .play-button {
          transform: translate(-50%, -50%) scale(1.05);
        }
        
        .rings {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 2em;
          margin: 2em auto;
          width: 800px;
        
          @media (max-width: 767px) {
            font-size: 1.3em;
            grid-template-columns: 1fr;
            gap: 1.5em;
            width: 300px;
          }
        
          > div {
            aspect-ratio: 1 / 1;
            border: 3px solid #6822dd;
            border-radius: 50%;
            background: #390d91;
          }
        
          span {
            align-items: center;
            aspect-ratio: 1 / 1;
            background: url("https://mcdn.tubitv.com/tubitv-assets/img/landing-page/circle.png") 50%/100% auto no-repeat;
            color: var(--yellow);
            display: flex;
            font-family: "TubiStans-Black";
            font-size: 2.5em;
            justify-content: center;
            margin: 0.5em auto;
            width: 1.5em;
          }
        
          h3 {
            font-size: 1.8em;
            margin: 0 0 0.5em;
        
            @media (max-width: 767px) {
              font-size: 1.4em;
            }
          }
        
          p {
            font-size: 0.9em;
            padding: 0 2em;
        
            @media (max-width: 767px) {
              font-size: 0.85em;
              padding: 0 1.5em;
            }
          }
        
          + p {
            max-width: 100%;
            margin-bottom: 5rem;
        
            @media (max-width: 767px) {
              margin-bottom: 3rem;
            }
          }
        }
        
        .icon {
          border-radius: 2em;
          border: 3px solid #6822dd;
          display: block;
          margin: 3rem auto;
          width: 100%;
        }
        
        .icon-link {
          display: block;
          margin: 3rem auto;
          width: 14em;
        
          @media (max-width: 767px) {
            margin: 2rem auto;
          }
        
          a {
            transition: filter 0.3s;
            will-change: filter;
        
            &:hover {
              filter: saturate(1.2);
            }
          }
        
          + h3 {
            font-size: 2.5em;
            margin-bottom: 2rem;
        
            @media (max-width: 767px) {
              font-size: 6.4vw;
              margin-bottom: 1.5rem;
            }
        
            + p {
              margin-bottom: 4rem;
              width: 500px;
        
              @media (max-width: 767px) {
                margin-bottom: 3rem;
                width: 100%;
              }
            }
          }
        }` }}
        />

        <header className="header" data-aos="fade-in" data-aos-delay="150">
          <h1>
            <a href="https://tubitv.com" style={{ borderBottom: 'none' }}>
              <img src="https://mcdn.tubitv.com/tubitv-assets/img/landing-page/logo.png" alt="Tubi" className="header__logo" />
            </a>
          </h1>
          <a className="add" href="https://chromewebstore.google.com/detail/productubity-by-tubi/hnognghpelnpmjbbnhedhfeljbccaaoi?utm_source=landingpage&utm_medium=referral&utm_campaign=productubity_launch">
            <h3>Add to Chrome</h3>
          </a>
        </header>

        <main className="main">
          <h2 className="intro">
            <span
              data-aos="fade-up"
              data-aos-delay="150"
            >A professional-grade</span
            >
            <span data-aos="fade-up" data-aos-delay="300">disguise for your</span>
            <span data-aos="fade-up" data-aos-delay="450">extremely</span>
            <span data-aos="fade-up" data-aos-delay="600">unprofessional</span>
            <span data-aos="fade-up" data-aos-delay="750">streaming habits.</span>
          </h2>

          <p data-aos="fade-in" data-aos-delay="1200">
            <b>Productubity</b> is a Chrome extension that lets you stream Tubi at
            work without anyone noticing. With one keystroke, it pauses your video
            and replaces it with a full-screen fake article filled with business
            jargon, light productivity tips, and charts that look just boring
            enough to be real. <br /><br />
            It is a convincing workplace decoy for anyone toggling between horror
            movies and Excel sheets.
          </p>

          <div
            className="add-wrapper"
            data-aos="zoom-in"
            data-aos-delay="1400"
            data-aos-duration="600"
          >
            <a className="add" href="https://chromewebstore.google.com/detail/productubity-by-tubi/hnognghpelnpmjbbnhedhfeljbccaaoi?utm_source=landingpage&utm_medium=referral&utm_campaign=productubity_launch">
              <h3>Add to Chrome</h3>
            </a>
          </div>

          <div className="video" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/bUCxgCe-3pI"
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ borderRadius: '12px', maxWidth: '100%' }}
            />
          </div>

          <h2 data-aos="fade-up">How it Works</h2>
          <div className="rings">
            <div
              data-aos="fade-right"
              data-aos-delay="100"
              data-aos-duration="700"
            >
              <span>1</span>
              <h3>Install</h3>
              <p>Install the extension from the&nbsp;<b>Chrome Web Store</b></p>
            </div>
            <div data-aos="fade-up" data-aos-delay="200" data-aos-duration="700">
              <span>2</span>
              <h3>Watch</h3>
              <p>Start watching on <b>tubitv.com</b></p>
            </div>
            <div
              data-aos="fade-left"
              data-aos-delay="300"
              data-aos-duration="700"
            >
              <span>3</span>
              <h3>Switch</h3>
              <p>
                Press <b>Ctrl + Shift + U</b> <br />
                (or <b>Cmd + Shift + U</b> <br />
                on Mac)
              </p>
            </div>
          </div>

          <p data-aos="fade-in" data-aos-delay="100">
            There are no menus and no setup. It works only on desktop Chrome and
            only on Tubi.
          </p>

          <h2 data-aos="fade-up">Where to Find It</h2>
          <div
            className="icon-link"
            data-aos="zoom-in"
            data-aos-delay="200"
            data-aos-duration="600"
          >
            <a
              href="https://chromewebstore.google.com/detail/productubity-by-tubi/hnognghpelnpmjbbnhedhfeljbccaaoi?utm_source=landingpage&utm_medium=referral&utm_campaign=productubity_launch"
            ><img
              src="https://mcdn.tubitv.com/tubitv-assets/img/landing-page/icon.jpg"
              alt="Productubity Icon"
              className="icon"
            /></a>
          </div>
          <h3 data-aos="fade-up" data-aos-delay="100">
            <span
              data-aos="fade-up"
              data-aos-delay="100"
            >You can get PRODUCTUBITY</span>
            <span
              data-aos="fade-up"
              data-aos-delay="250"
            >on the&nbsp;
              <a href="https://chromewebstore.google.com/detail/productubity-by-tubi/hnognghpelnpmjbbnhedhfeljbccaaoi?utm_source=landingpage&utm_medium=referral&utm_campaign=productubity_launch">Chrome Web Store</a></span>
          </h3>
          <p data-aos="fade-in" data-aos-delay="800">
            Tubi Productubity only functions when you are streaming on tubitv.com,
            but it must be installed first.
          </p>

          <h2 data-aos="fade-up">Start Watching</h2>
          <div
            className="add-wrapper"
            data-aos="zoom-in"
            data-aos-delay="200"
            data-aos-duration="600"
          >
            <a className="add" href="https://chromewebstore.google.com/detail/productubity-by-tubi/hnognghpelnpmjbbnhedhfeljbccaaoi?utm_source=landingpage&utm_medium=referral&utm_campaign=productubity_launch">
              <h3>Add to Chrome</h3>
            </a>
          </div>
        </main>
        <script src="https://unpkg.com/aos@2.3.1/dist/aos.js" />
      </div>

    </div>
  );
};

export default ProductubityLanding;
