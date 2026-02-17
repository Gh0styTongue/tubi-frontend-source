import { ATag } from '@tubitv/web-ui';
import classNames from 'classnames';
import React from 'react';

import Facebook from 'common/components/uilib/SvgLibrary/Facebook';
import Instagram from 'common/components/uilib/SvgLibrary/Instagram';
import LinkedIn from 'common/components/uilib/SvgLibrary/LinkedIn';
import Twitter from 'common/components/uilib/SvgLibrary/Twitter';

import styles from './FollowUs.scss';
import { EXTERNAL_LINKS } from '../../../constants/routes';

/**
 * wraps all our social media icons, links to those pages
 * use cls prop to style position, width, etc
 */
const FollowUs = ({ cls, inverted }: { cls?: string, inverted?: boolean }) => {
  const containerCls = classNames(styles.followUsContainer, cls, {
    [styles.inverted]: inverted,
  });
  return (
    <div className={containerCls} data-test-id="follow-us">
      <div className={styles.iconsRow}>
        <ATag
          cls={styles.facebookIcon}
          to={EXTERNAL_LINKS.facebookPage}
          rel="noopener"
          target="_blank"
        >
          <Facebook />
        </ATag>
        <ATag
          cls={styles.instagramIcon}
          to={EXTERNAL_LINKS.instagramPage}
          rel="noopener"
          target="_blank"
        >
          <Instagram />
        </ATag>
        <ATag
          cls={styles.twitterIcon}
          to={EXTERNAL_LINKS.twitterPage}
          rel="noopener"
          target="_blank"
        >
          <Twitter />
        </ATag>
        <ATag
          cls={styles.linkedInIcon}
          to={EXTERNAL_LINKS.linkedInPage}
          rel="noopener"
          target="_blank"
        >
          <LinkedIn />
        </ATag>
      </div>
    </div>
  );
};

export default FollowUs;
