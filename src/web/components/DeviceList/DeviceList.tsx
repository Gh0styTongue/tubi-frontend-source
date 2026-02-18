import { Amazon } from '@tubitv/icons';
import classNames from 'classnames';
import React from 'react';
import { useIntl } from 'react-intl';
import { Link } from 'react-router';

import AndroidManIcon from 'common/components/uilib/SvgLibrary/AndroidManIcon';
import AppleTVIconRectangle from 'common/components/uilib/SvgLibrary/AppleTVIconRectangle';
import ChromecastIcon from 'common/components/uilib/SvgLibrary/ChromecastIcon';
import RokuIconRectangle from 'common/components/uilib/SvgLibrary/RokuIconRectangle';
import XboxIcon from 'common/components/uilib/SvgLibrary/XboxIcon';
import { WEB_ROUTES } from 'common/constants/routes';

import styles from './DeviceList.scss';
import messages from './deviceListMessages';

interface Props {
  className?: string;
}

const DeviceList = ({ className }: Props) => {
  const { formatMessage } = useIntl();

  return (
    <div className={classNames(styles.root, className)}>
      <p className={styles.desc}>{formatMessage(messages.desc)}</p>

      <div className={styles.logos}>
        <Link to={`${WEB_ROUTES.devices}?device=roku`}>
          <RokuIconRectangle style={{ fontSize: '48px' }} />
        </Link>
        <Link to={`${WEB_ROUTES.devices}?device=tvos`}>
          <AppleTVIconRectangle style={{ fontSize: '48px' }} />
        </Link>
        <Link to={`${WEB_ROUTES.devices}?device=amazon`}>
          <Amazon style={{ fontSize: '24px' }} />
        </Link>
        <Link to={`${WEB_ROUTES.devices}?device=chromecast`}>
          <ChromecastIcon style={{ fontSize: '48px' }} />
        </Link>
        <Link to={`${WEB_ROUTES.devices}?device=androidtv`}>
          <AndroidManIcon style={{ fontSize: '24px' }} />
        </Link>
        <Link to={`${WEB_ROUTES.devices}?device=xbox`}>
          <XboxIcon style={{ fontSize: '44px' }} />
        </Link>
      </div>

      <Link className={styles.viewAll} to={WEB_ROUTES.devices}>
        {formatMessage(messages.viewAll)}
      </Link>
    </div>
  );
};

export default DeviceList;
