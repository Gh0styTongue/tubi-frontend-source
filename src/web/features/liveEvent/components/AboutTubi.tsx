/* istanbul ignore file */
import { ButtonType } from '@tubitv/analytics/lib/componentInteraction';
import { Button } from '@tubitv/web-ui';
import React, { useCallback } from 'react';
import { injectIntl } from 'react-intl';
import type { WrappedComponentProps } from 'react-intl';

import * as eventTypes from 'common/constants/event-types';
import { WEB_ROUTES } from 'common/constants/routes';
import tubiHistory from 'common/history';
import { buildComponentInteractionEvent } from 'common/utils/analytics';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { trackEvent } from 'common/utils/track';

import styles from '../containers/LiveEventDetails/LiveEventDetails.scss';
import messages from '../messages';

interface AboutTubiProps extends WrappedComponentProps {
  forwardedRef?: React.Ref<HTMLDivElement>;
}

const AboutTubi: React.FC<AboutTubiProps> = ({ intl, forwardedRef }) => {
  const handleExploreClick = useCallback(() => {
    const event = buildComponentInteractionEvent({
      pathname: getCurrentPathname(),
      userInteraction: 'CONFIRM',
      component: 'BUTTON',
      buttonType: ButtonType.TEXT,
      buttonValue: 'EXPLORE_TUBI',
    });
    trackEvent(eventTypes.COMPONENT_INTERACTION_EVENT, event);
    tubiHistory.push(WEB_ROUTES.home);
  }, []);

  return (
    <div ref={forwardedRef} className={styles.aboutTubi}>
      <div className={styles.background}>
        <img src={require('../assets/about-t.png')} alt="tubi logo" className={styles.bgT} />
      </div>
      <div className={styles.banner}>
        <h2 className={styles.title}>{intl.formatMessage(messages.aboutTubiTitle)}</h2>
        <div className={styles.description}>{intl.formatMessage(messages.aboutTubiDescription)}</div>
        <Button
          size="medium"
          // eslint-disable-next-line react/forbid-component-props
          className={styles.exploreButton}
          onClick={handleExploreClick}
        >
          {intl.formatMessage(messages.exploreButton)}
        </Button>
      </div>
    </div>
  );
};

export default injectIntl(AboutTubi);
