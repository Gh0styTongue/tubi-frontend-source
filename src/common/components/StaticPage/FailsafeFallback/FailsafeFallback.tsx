/* istanbul ignore file */
import React from 'react';
import { useIntl } from 'react-intl';

import { WEB_ROUTES } from 'common/constants/routes';
import { useCurrentDate } from 'common/context/CurrentDateContext';
import { useLocation } from 'common/context/ReactRouterModernContext';
import useAppSelector from 'common/hooks/useAppSelector';
import { majorEventFailsafeMessageSelector } from 'common/selectors/remoteConfig';
import { getFormattedFailsafeMessage } from 'common/utils/failsafe';

import styles from '../StaticPage.scss';

const assetsMap = {
  [WEB_ROUTES.search]: {
    feature: 'search' as const,
    image: require('../assets/failsafe-search.png'),
  },
  [WEB_ROUTES.myStuff]: {
    feature: 'myStuff' as const,
    image: require('../assets/failsafe-my-stuff.png'),
  },
};

const FailsafeFallback = () => {
  const intl = useIntl();
  const location = useLocation();
  const currentDate = useCurrentDate();
  const { header, subtext, endTime } = useAppSelector(majorEventFailsafeMessageSelector);

  const page = location.query?.from || WEB_ROUTES.search;
  if (!page || !assetsMap[page as keyof typeof assetsMap]) { return null; }

  const { feature, image } = assetsMap[page as keyof typeof assetsMap];
  const { formattedHeader, formattedSubtext } = getFormattedFailsafeMessage({
    intl,
    currentDate,
    endTime,
    header,
    subtext,
    feature,
  });

  return (
    <div className={styles.failsafeFallbackContainer}>
      <img src={image} alt={`${feature} is unavailable`} />
      { formattedHeader ? <h1>{formattedHeader}</h1> : null }
      { formattedSubtext ? <p>{formattedSubtext}</p> : null }
    </div>
  );
};

/**
 * StaticPage route expects functional component, so wrap the class here
 */
export default FailsafeFallback;
