import { Button, Spinner, SpinnerSize } from '@tubitv/web-ui';
import classNames from 'classnames';
import React, { useEffect } from 'react';
import { useIntl } from 'react-intl';

import { loadContainer } from 'common/actions/container';
import { FEATURED_CONTAINER_ID } from 'common/constants/constants';
import { WEB_ROUTES } from 'common/constants/routes';
import { useLocation } from 'common/context/ReactRouterModernContext';
import tubiHistory from 'common/history';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import { getPath } from 'web/features/seo/utils/seo';
import { FEATURED_CONTENTS_LIMIT } from 'web/features/watchSchedule/constants/landing';
import {
  containerContentIdsLoadStatusSelector,
  containerContentIdsSelector,
} from 'web/features/watchSchedule/selectors/landing';
import FluidGrid from 'web/rd/components/FluidGrid/FluidGrid';

import styles from './VodContents.scss';
import messages from './vodContentsMessages';

const VodSection: React.FC<{ containerId?: string }> = ({ containerId = FEATURED_CONTAINER_ID }) => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const contentIds = useAppSelector((state) => containerContentIdsSelector(state, { containerId, pathname: location.pathname }));
  const { loading, loaded } = useAppSelector((state) => containerContentIdsLoadStatusSelector(state, { containerId, pathname: location.pathname }));
  const { formatMessage } = useIntl();

  useEffect(() => {
    if (!loaded) {
      dispatch(
        loadContainer({
          location,
          id: containerId,
          limit: FEATURED_CONTENTS_LIMIT,
        })
      );
    }
  }, [dispatch, loaded, containerId, location]);

  const gridProps = {
    contentIds,
    breakpoints: {
      xs: '4',
      lg: '3',
    },
  };

  const buttonProps = {
    className: styles.button,
    appearance: 'tertiary' as const,
    children: formatMessage(messages.button),
    onClick: () => {
      tubiHistory.push(
        containerId === FEATURED_CONTAINER_ID
          ? WEB_ROUTES.home
          : getPath(WEB_ROUTES.categoryIdTitle, { id: containerId })
      );
    },
  };

  return (
    <div className={styles.root}>
      <div className={styles.main}>
        <h2>{formatMessage(messages.title)}</h2>
        <p>{formatMessage(messages.desc)}</p>
        <div className={classNames(styles.content, { [styles.withSpinner]: loading })}>
          {loading ? (
            <Spinner size={SpinnerSize.LG} />
          ) : (
            <React.Fragment>
              <FluidGrid {...gridProps} />
              <Button {...buttonProps} />
            </React.Fragment>
          )}
        </div>
      </div>
    </div>
  );
};

export default VodSection;
