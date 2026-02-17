import { useEffect, useRef } from 'react';
import { useIntl } from 'react-intl';
import { useDispatch } from 'react-redux';

import useAppSelector from 'common/hooks/useAppSelector';

import { bannerStateSelector } from '../selectors/fixedBannerSelectors';
import type { FixedBannerState } from '../types/fixedBanner';
import { getActiveBanner } from '../utils/fixedBanner';

const useFixedBanner = (): FixedBannerState['bannerState'] => {
  const dispatch = useDispatch();
  const intl = useIntl();
  const didShowBannerRef = useRef(false);

  // calculate which banner should be shown
  const banner = getActiveBanner();

  // handle showing the banner
  useEffect(() => {
    if (didShowBannerRef.current) return; // only show one banner per session
    if (banner) {
      banner.show({ dispatch, intl }); // set the banner object to redux
      didShowBannerRef.current = true;
    }
  }, [banner, dispatch, intl]);

  // return the banner object from redux
  return useAppSelector(bannerStateSelector);
};

export default useFixedBanner;
