import classnames from 'classnames';
import type { FC } from 'react';
import React, { useState, memo, useRef, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { defineMessages } from 'react-intl';

import { useIntl } from 'i18n/intl';

import styles from './BackgroundImage.scss';

interface Props {
  preload?: boolean;
  src: string;
  srcMobile?: string;
}

const messages = defineMessages({
  posterAlt: {
    description: 'alternative text for poster background',
    defaultMessage: 'poster background',
  },
});

// Matches the breakpoints defined here (<sMd):
// https://github.com/adRise/www/blob/924eaf07e6e978ad6936d7265a446e88faa237f2/packages/web-ui/src/styles/_responsive.scss#L13-L21
const desktopMediaQuery = '(min-width: 540px)';
const mobileMediaQuery = '(max-width: 539px)';

const BackgroundImage: FC<Props> = ({ preload = false, src, srcMobile }) => {
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  const intl = useIntl();
  const imageStyle = classnames({
    [styles.load]: loaded,
  });
  const onLoad = () => {
    setLoaded(true);
  };
  useEffect(() => {
    if (ref.current && ref.current.complete) {
      setTimeout(onLoad, 200);
    }
  }, []);

  return (
    <div className={styles.backgroundImage} data-test-id="web-background-image">
      {preload ? (
        <Helmet>
          <link rel="preload" as="image" href={src} media={desktopMediaQuery} />
          {srcMobile && <link rel="preload" as="image" href={srcMobile} media={mobileMediaQuery} />}
        </Helmet>
      ) : null}
      <picture>
        {srcMobile && <source srcSet={srcMobile} media={mobileMediaQuery} data-test-id="background-image-mobile-source" />}
        <img
          ref={ref}
          src={src}
          alt={intl.formatMessage(messages.posterAlt)}
          className={imageStyle}
          onLoad={onLoad}
        />
      </picture>
    </div>
  );
};

export default memo(BackgroundImage);
