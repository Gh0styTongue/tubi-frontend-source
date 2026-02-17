import { ATag } from '@tubitv/web-ui';
import classNames from 'classnames';
import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Link } from 'react-router';

import Badge from 'common/components/uilib/Badge/Badge';
import { WEB_ROUTES } from 'common/constants/routes';
import type { VideoRating } from 'common/types/video';
import Button from 'web/components/Button/Button';

import { WarningIcon, MatureIcon } from './Icons';
import styles from './WarningBlocks.scss';

const messages = defineMessages({
  adblock: {
    description: 'ad block warning heading',
    defaultMessage: 'Please disable your ad-blocker to watch this title.',
  },
  adblockDesc: {
    description: 'ad block warning description',
    defaultMessage: 'For instructions on how to whitelist tubitv.com, visit our <customtag>support page</customtag>.',
  },
  unavailable: {
    description: 'content is unavailable to watch heading',
    defaultMessage: 'Content Unavailable',
  },
  unavailableDesc: {
    description: 'content is unavailable to watch description',
    defaultMessage: 'Sorry, this video is not currently available.',
  },
  drm: {
    description: 'content is unavailable to watch due to DRM issue heading',
    defaultMessage: 'Content requires DRM',
  },
  drmDesc: {
    description: 'content is unavailable to watch due to DRM issue description',
    defaultMessage: 'Sorry, this video requires DRM. You can troubleshoot DRM issues using this <customtag>link</customtag>.',
  },
  castUnavailable: {
    description: 'casting is unavailable for the content heading',
    defaultMessage: 'We\'re sorry, but Chromecast is not available for this title.',
  },
  castUnavailableDesc: {
    description: 'casting is unavailable for the content description',
    defaultMessage: 'Stop casting to watch this title in our web player',
  },
  error: {
    description: 'error loading the video heading',
    defaultMessage: 'Sorry, there was a problem loading the video player.',
  },
  errorDesc: {
    description: 'error loading the video description',
    defaultMessage: 'Please try to reload the page.',
  },
  errorDesc2: {
    description: 'error loading the video description',
    defaultMessage: 'If you are using an ad-blocker, please disable it or <customtag>whitelist tubitv.com</customtag>',
  },
  networkError: {
    description: 'network error during playback heading',
    defaultMessage: 'No internet connection.',
  },
  networkErrorDesc: {
    description: 'network error during playback description',
    defaultMessage: 'Please try again when your connection is available.',
  },
  errorDesc3: {
    description: 'error loading the video description',
    defaultMessage: 'If the problem persists, please contact us at <supportLink>tubitv.com/support</supportLink>',
  },
  matureSignIn: {
    description: 'mature content warning link to sign in',
    defaultMessage: 'Sign In',
  },
  matureRegister: {
    description: 'mature content warning link to register',
    defaultMessage: 'Don\'t have an account? <customtag>Register</customtag>',
  },
  kidsModeMessage: {
    description: 'message indicating that the video is disallowed due it being rated above the current kids mode level',
    defaultMessage: 'This video is rated above your allowed level',
  },
});

const supportLink = (text: React.ReactNode[]) => <ATag to="https://tubitv.com/support">{text}</ATag>;

export const AdBlockWarning = ({ className }:{ className?: string }) => {
  const outerCls = classNames(styles.warning, styles.adblock, className);
  return (
    <div className={outerCls} data-nosnippet>
      <WarningIcon className={styles.adblockIcon} />
      <div className={styles.text}>
        <div className={styles.head}><FormattedMessage {...messages.adblock} /></div>
        <div className={styles.sub}>
          <FormattedMessage {...messages.adblockDesc} values={{ customtag: ([msg]) => <ATag to="https://tubitv.com/help-center/Setup-and-Troubleshooting/articles/4410093830939">{msg}</ATag> }} />
        </div>
      </div>
    </div>
  );
};

export const MatureContentWarning = (
  { message, showLogin = true, pathname, className }: {
    message: JSX.Element,
    showLogin?: boolean,
    pathname: string,
    className?: string,
  }) => {
  const cls = classNames(styles.warning, styles.mature, className);
  return (
    <div className={cls}>
      <MatureIcon />
      <div className={styles.text}>
        <div className={styles.sub}>{message}</div>
      </div>
      {showLogin
        ? <div className={styles.extra}>
          <Link to={`${WEB_ROUTES.signIn}?redirect=${pathname}`}>
            <Button>
              <FormattedMessage {...messages.matureSignIn} />
            </Button>
          </Link>
          <br />
          <span className={styles.hint}>
            <FormattedMessage
              {...messages.matureRegister}
              values={{
                customtag: ([msg]: React.ReactNode[]) => <ATag to={`${WEB_ROUTES.register}?redirect=${pathname}`}>{msg}</ATag>,
              }}
            />
          </span>
        </div>
        : null}
    </div>
  );
};

export const DRMUnsupportedWarning = ({ className }:{ className?: string }) => {
  const cls = classNames(styles.warning, styles.unavailable, className);
  return (
    <div className={cls}>
      <div className={styles.text}>
        <div className={styles.head}><FormattedMessage {...messages.drm} /></div>
        <div className={styles.sub}><FormattedMessage
          {...messages.drmDesc}
          values={{
            customtag: ([msg]: React.ReactNode[]) => <ATag to="https://tubitv.com/help-center/Setup-and-Troubleshooting/articles/4410077357467">{msg}</ATag>,
          }}
        /></div>
      </div>
    </div>
  );
};

export const MatureContentInKidsModeWarning = (
  { className, rating = undefined }:{ className?: string, rating?: VideoRating[] }) => {
  const cls = classNames(styles.warning, styles.unavailable, className);
  return (
    <div className={cls}>
      {rating && !!rating.length ? <Badge text={rating[0].value} className={styles.ratingBadge} /> : null }
      <div className={styles.text}>
        <div className={styles.head}><FormattedMessage {...messages.kidsModeMessage} /></div>
      </div>
    </div>
  );
};

export const PlayerErrorWarning = ({ className }:{ className?: string }) => {
  const cls = classNames(styles.warning, styles.unavailable, className);
  return (
    <div className={cls} data-nosnippet>
      <div className={styles.text}>
        <div className={styles.head}><FormattedMessage {...messages.error} /></div>
        <div className={styles.sub}><FormattedMessage {...messages.errorDesc} /></div>
        <div className={styles.sub}>
          <FormattedMessage
            {...messages.errorDesc2}
            values={{
              customtag: ([msg]) => <ATag
                to="https://tubitv.com/help-center/Setup-and-Troubleshooting/articles/4410093830939"
              >{msg}</ATag>,
            }}
          />
        </div>
        <div className={styles.sub}><FormattedMessage
          {...messages.errorDesc3}
          values={{ supportLink }}
        /></div>
      </div>
    </div>
  );
};

export const NetworkErrorWarning = ({ className }:{ className?: string }) => {
  const cls = classNames(styles.warning, styles.unavailable, className);
  return (
    <div className={cls} data-nosnippet>
      <div className={styles.text}>
        <div className={styles.head}><FormattedMessage {...messages.networkError} /></div>
        <div className={styles.sub}><FormattedMessage {...messages.networkErrorDesc} /></div>
        <div className={styles.sub}><FormattedMessage
          {...messages.errorDesc3}
          values={{ supportLink }}
        /></div>
      </div>
    </div>
  );
};
