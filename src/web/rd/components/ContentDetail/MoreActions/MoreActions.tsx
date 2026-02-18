import { ANALYTICS_COMPONENTS } from '@tubitv/analytics/lib/components';
import {
  More,
  Close,
} from '@tubitv/icons';
import { ATag, Button, useOnClickOutside } from '@tubitv/web-ui';
import classnames from 'classnames';
import type { FC } from 'react';
import React, { useCallback, useRef, useState } from 'react';
import { defineMessages } from 'react-intl';

import { WEB_ROUTES } from 'common/constants/routes';
import trackingManager from 'common/services/TrackingManager';
import { ContentDetailPageNavOption } from 'common/types/ottUI';
import { useIntl } from 'i18n/intl';
import { trackContentDetailNavComponentInteractionEvent } from 'ott/utils/contentDetailNav';

import styles from './MoreActions.scss';

export const messages = defineMessages({
  reportAProblem: {
    description: 'text for the report problem button',
    defaultMessage: 'Report a problem',
  },
});

interface Props {
  title: string;
  contentId: string;
  isNewDesign?: boolean;
}

const MoreActions: FC<Props> = ({
  title,
  contentId,
  isNewDesign,
}) => {
  const intl = useIntl();
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  /* istanbul ignore next */
  useOnClickOutside(ref, () => setShow(false));
  const supportLink = {
    pathname: WEB_ROUTES.support,
    query: { title, contentId },
  };

  const handleClickReportProblem = useCallback(() => {
    trackingManager.createNavigateToPageComponent({
      componentType: ANALYTICS_COMPONENTS.middleNavComponent,
      endY: ContentDetailPageNavOption.ReportProblem,
    });
    trackContentDetailNavComponentInteractionEvent({ componentSectionIndex: ContentDetailPageNavOption.ReportProblem });
  }, []);

  const onClick = useCallback(() => setShow(show => !show), []);

  return (
    <div className={classnames(styles.moreActions, { [styles.newDesign]: isNewDesign })} ref={ref}>
      <Button
        appearance="tertiary"
        onClick={onClick}
        className={styles.iconButton}
        icon={show ? Close : More}
        iconSize="large"
      />
      {show ? (
        <div className={classnames(styles.menu)}>
          <div className={classnames(styles.options)}>
            <ATag onClick={handleClickReportProblem} className={styles.option} to={supportLink}>
              {intl.formatMessage(messages.reportAProblem)}
            </ATag>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default MoreActions;
