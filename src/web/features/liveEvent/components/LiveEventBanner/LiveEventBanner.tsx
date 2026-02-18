import { ATag } from '@tubitv/web-ui';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import AppStoreBadge from 'common/components/uilib/SvgLibrary/AppStoreBadge';
import GooglePlayBadge from 'common/components/uilib/SvgLibrary/GooglePlayBadge';
import Tubi from 'common/components/uilib/SvgLibrary/Tubi';
import { EXTERNAL_LINKS } from 'common/constants/routes';
import useAppSelector from 'common/hooks/useAppSelector';
import { isSpanishLanguageSelector } from 'common/selectors/ui';

import styles from './LiveEventBanner.scss';

const messages = defineMessages({
  watchOnTubiAppText: {
    description: 'banner text of watch game on the Tubi mobile app',
    defaultMessage: 'Get the Tubi mobile app to take the game on the go',
  },
});

const LiveEventBanner = () => {
  const { viewportType } = useAppSelector((state) => state.ui);
  const isDesktop = viewportType === 'desktop';
  const intl = useIntl();
  const isSpanishLanguage = useAppSelector(isSpanishLanguageSelector);

  if (!isDesktop) {
    return null;
  }

  return (
    <div className={styles.banner}>
      <div className={styles.logo}>
        <Tubi />
      </div>
      <div className={styles.text}>
        {intl.formatMessage(messages.watchOnTubiAppText)}
      </div>
      <div className={styles.downloadLinks}>
        <ATag target="_blank" to={EXTERNAL_LINKS.appIOS}>
          <AppStoreBadge isSpanishLanguage={isSpanishLanguage} />
        </ATag>
        <ATag target="_blank" to={EXTERNAL_LINKS.appAndroid}>
          <GooglePlayBadge isSpanishLanguage={isSpanishLanguage} />
        </ATag>
      </div>
    </div>
  );
};

export default LiveEventBanner;
