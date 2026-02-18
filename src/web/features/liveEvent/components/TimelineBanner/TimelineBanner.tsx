/* istanbul ignore file */
import { ButtonType } from '@tubitv/analytics/lib/componentInteraction';
import { Button } from '@tubitv/web-ui';
import classnames from 'classnames';
import React, { useCallback } from 'react';
import { injectIntl } from 'react-intl';
import type { WrappedComponentProps } from 'react-intl';

import * as eventTypes from 'common/constants/event-types';
import { buildComponentInteractionEvent } from 'common/utils/analytics';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { trackEvent } from 'common/utils/track';

import styles from './TimelineBanner.scss';
import { HOW_TO_WATCH_URL } from '../../constants';
import messages from '../../messages';

const TimelineBanner: React.FC<WrappedComponentProps> = ({ intl }) => {
  const handleHowToWatchClick = useCallback(() => {
    const event = buildComponentInteractionEvent({
      pathname: getCurrentPathname(),
      userInteraction: 'CONFIRM',
      component: 'BUTTON',
      buttonType: ButtonType.TEXT,
      buttonValue: 'HOW_TO_WATCH',
    });
    trackEvent(eventTypes.COMPONENT_INTERACTION_EVENT, event);
    window.open(HOW_TO_WATCH_URL, '_blank');
  }, []);
  const buttonText = intl.formatMessage(messages.liveEventTimelineCta);
  return (
    <div className={classnames(styles.timelineBanner)}>
      <div className={styles.eventBackground} />
      <img
        className={styles.eventLogo}
        src={require('../../assets/logo-lockup.png')}
        alt="NFL logo"
      />
      <div className={styles.eventTimelineGroup}>
        <div className={styles.timeline} aria-label="Event timeline">
          <span className={classnames(styles.dot, styles.dotLeft)} aria-hidden="true" />
          <span className={classnames(styles.dot, styles.dotCenter)} aria-hidden="true" />
          <span className={classnames(styles.dot, styles.dotLargeFaint)} aria-hidden="true" />
          <span className={classnames(styles.dot, styles.dotMediumFaint)} aria-hidden="true" />

          <span className={classnames(styles.line, styles.lineLeft)} aria-hidden="true" />
          <span className={classnames(styles.line, styles.lineRight)} aria-hidden="true" />

          <span className={styles.pregame}>{intl.formatMessage(messages.liveEventTimelinePregame)}</span>
          <span className={styles.kickoff}>{intl.formatMessage(messages.liveEventTimelineKickoff)}</span>
          <span className={styles.timeLeft}>{intl.formatMessage(messages.liveEventTimelineTimeLeft)}</span>
          <span className={styles.timeRight}>{intl.formatMessage(messages.liveEventTimelineTimeRight)}</span>
        </div>
      </div>

      <Button
        // eslint-disable-next-line react/forbid-component-props
        className={styles.eventCta}
        size="medium"
        onClick={handleHowToWatchClick}
        aria-label={buttonText}
      >
        {buttonText}
      </Button>
    </div>
  );
};

export default injectIntl(TimelineBanner);
