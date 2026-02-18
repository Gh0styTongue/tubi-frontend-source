import classNames from 'classnames';
import React, { memo } from 'react';

import type { SvgIconProps } from 'common/components/uilib/SvgIcon/SvgIcon';
import AmazonFireIconRectangle from 'common/components/uilib/SvgLibrary/AmazonFireIconRectangle';
import AndroidIcon from 'common/components/uilib/SvgLibrary/AndroidIcon';
import AppleTVIconRectangle from 'common/components/uilib/SvgLibrary/AppleTVIconRectangle';
import BellIcon from 'common/components/uilib/SvgLibrary/BellIcon';
import ChromecastIcon from 'common/components/uilib/SvgLibrary/ChromecastIcon';
import IosIconRectangle from 'common/components/uilib/SvgLibrary/IosIconRectangle';
import LGTVIcon from 'common/components/uilib/SvgLibrary/LGTVIcon';
import PS4Icon from 'common/components/uilib/SvgLibrary/PS4Icon';
import RogersIcon from 'common/components/uilib/SvgLibrary/RogersIcon';
import RokuIconRectangle from 'common/components/uilib/SvgLibrary/RokuIconRectangle';
import SamsungIcon from 'common/components/uilib/SvgLibrary/SamsungIcon';
import SonyIcon from 'common/components/uilib/SvgLibrary/SonyIcon';
import VizioIcon from 'common/components/uilib/SvgLibrary/VizioIcon';
import XboxIcon from 'common/components/uilib/SvgLibrary/XboxIcon';
import XfinityIcon from 'common/components/uilib/SvgLibrary/XfinityIcon';
import { SUPPORTED_COUNTRY } from 'i18n/constants';

import styles from './PlatformIconsList.scss';

interface Props {
  className?: string;
  countryCode: SUPPORTED_COUNTRY;
}

const { lg, md, sm, xs } = styles;

const Roku = { component: RokuIconRectangle, className: md };
const AmazonFire = { component: AmazonFireIconRectangle, className: lg };
const Samsung = { component: SamsungIcon, className: lg };
const Sony = { component: SonyIcon, className: md };
const LGTV = { component: LGTVIcon, className: sm };
const Android = { component: AndroidIcon, className: sm };
const Chromecast = { component: ChromecastIcon, className: lg };
const iOS = { component: IosIconRectangle, className: sm };
const AppleTV = { component: AppleTVIconRectangle, className: sm };
const Xbox = { component: XboxIcon, className: sm };
const PS4 = { component: PS4Icon, className: lg };
const Vizio = { component: VizioIcon, className: xs };
const Xfinity = { component: XfinityIcon, className: md };
const Rogers = { component: RogersIcon, className: md };
const Bell = { component: BellIcon, className: md };

const defaultList = [Roku, AmazonFire, Samsung, Sony, LGTV, Android, Chromecast, iOS, AppleTV, Xbox, PS4, Vizio, Xfinity];
// it's possible that in the future the latam list and pacific list could be different, let's differentiate by regions
const latamList = [Roku, AmazonFire, Samsung, Sony, LGTV, Android, Chromecast, iOS, AppleTV, Xbox, PS4];
const pacificList = [Roku, AmazonFire, Samsung, Sony, LGTV, Android, Chromecast, iOS, AppleTV, Xbox, PS4];

const logoListByCountry: Record<string, { component: React.FunctionComponent<SvgIconProps>, className: string }[]> = {
  [SUPPORTED_COUNTRY.AU]: pacificList,
  [SUPPORTED_COUNTRY.NZ]: pacificList,
  [SUPPORTED_COUNTRY.CA]: [Rogers, Bell, Roku, AmazonFire, Samsung, Sony, LGTV, Android, Chromecast, iOS, AppleTV, Xbox, PS4],
  [SUPPORTED_COUNTRY.CR]: latamList,
  [SUPPORTED_COUNTRY.EC]: latamList,
  [SUPPORTED_COUNTRY.GT]: latamList,
  [SUPPORTED_COUNTRY.PA]: latamList,
  [SUPPORTED_COUNTRY.MX]: latamList,
  [SUPPORTED_COUNTRY.SV]: latamList,
};

const PlatformIconsList = ({ className, countryCode }: Props) => {
  const logoList = logoListByCountry[countryCode] || defaultList;
  return (
    <ul className={classNames(styles.root, className)}>
      {logoList.map(({ component: Logo, className }, idx) => (
        <li key={idx} className={styles.innerClass}>
          <Logo className={className} />
        </li>
      ))}
    </ul>
  );
};

const arePropsEqual = (prevProps: Props, nextProps: Props) => prevProps.className === nextProps.className;

export default memo(PlatformIconsList, arePropsEqual);
