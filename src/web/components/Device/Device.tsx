import { ATag } from '@tubitv/web-ui';
import React, { forwardRef } from 'react';
import { defineMessages, useIntl, FormattedMessage } from 'react-intl';
import { Link } from 'react-router';

import Button from 'web/components/Button/Button';

import styles from './Device.scss';

const messages = defineMessages({
  watchNow: {
    description: 'button text on device support page to redirect to home page',
    defaultMessage: 'Watch Now',
  },
  installNow: {
    description: 'button text on device support page to install tubi app',
    defaultMessage: 'Install Now',
  },
  minimumReq: {
    description: 'Minimum requirements label',
    defaultMessage: 'Minimum Requirements:',
  },
  helpLink: {
    description: 'text to tell the user to see our help article for supported countries and devices for tubi app',
    defaultMessage: 'For a list of countries where Tubi is available, see our <customtag>help article</customtag>',
  },
});

interface DeviceProps {
  href?: string;
  title?: string | JSX.Element;
  element?: JSX.Element;
  imageUrl: string;
  text: string | JSX.Element;
  requirements?: string | JSX.Element;
  downloadBadge?: JSX.Element;
  deviceHeader?: string | JSX.Element;
}

/**
 * Component that displays a Device type with an icon (element),
 * image, and description along with optional DL button. Main component of DevicesPage.
 * Note, you will most likely style the element in the parent (see DevicesPage.js)
 */
export const Device = forwardRef<HTMLDivElement, DeviceProps>(({ href: downloadUrl, title, element, imageUrl, text, requirements, downloadBadge, deviceHeader }, ref) => {
  const intl = useIntl();
  let downloadButton;
  if (downloadUrl) {
    downloadButton = (
      <Link className={styles.link} target="_blank" to={downloadUrl}>
        {downloadBadge || (
          <Button color="primary" inverse size="large">
            {downloadUrl === '/home' ? intl.formatMessage(messages.watchNow) : intl.formatMessage(messages.installNow)}
          </Button>)
        }
      </Link>
    );
  }

  return (
    <div ref={ref} className={styles.device} aria-live="assertive">
      {deviceHeader || element}
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.deviceContentRow}>
        <img className={styles.deviceImg} src={imageUrl} />
        <div className={styles.deviceSubText}>
          {text}
        </div>
        {downloadButton}
      </div>
      {requirements
        ? <div className={styles.requirements}>
          <span className={styles.smallBold}>{intl.formatMessage(messages.minimumReq)} </span> {requirements}
        </div> : null
      }
      <div className={styles.requirements}>
        <span className={styles.smallBold}>
          <FormattedMessage {...messages.helpLink} values={{ customtag: ([msg]) => <ATag to="https://tubitv.com/help-center/About-Tubi/articles/4409969055259">{msg}</ATag> }} />
        </span>
      </div>
    </div>
  );
});

export default Device;
