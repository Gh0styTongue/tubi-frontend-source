import { toCSSUrl } from '@adrise/utils/lib/url';
import { Grid } from '@tubitv/web-ui';
import classNames from 'classnames';
import React from 'react';
import { useIntl } from 'react-intl';

import { CONTENT_MODES, RECOMMENDED_LINEAR_CONTAINER_ID, WEB_HOSTNAME } from 'common/constants/constants';
import { WEB_ROUTES } from 'common/constants/routes';
import LinearWebVerticalFitPlayer from 'common/experiments/config/linearWebVerticalFitPlayer';
import useExperiment from 'common/hooks/useExperiment';
import type { ChannelEPGInfo } from 'common/types/epg';
import type { Video } from 'common/types/video';
import { getUrlByVideo } from 'common/utils/urlConstruction';
import ContainerRow from 'web/rd/components/ContentDetail/ContainerRow/ContainerRow';
import ShareButtons from 'web/rd/components/ShareButtons/ShareButtons';

import styles from './ChannelDetails.scss';
import messages from './channelDetailsMessages';
import EpgRow from './EpgRow/EpgRow';
import SectionTitle from './SectionTitle/SectionTitle';

export interface Props {
  channel: ChannelEPGInfo | Video;
}

const ContentDetails = ({ channel }: Props) => {
  const verticalFit = useExperiment(LinearWebVerticalFitPlayer);
  const { formatMessage } = useIntl();

  const { id: channelId, title, description } = channel;
  const landscapeImg = (channel as ChannelEPGInfo).images?.landscape?.[0] || (channel as Video).landscape_images?.[0];

  const rowProps = {
    id: RECOMMENDED_LINEAR_CONTAINER_ID,
    className: styles.recommendedChannels,
    forceCurrentMode: CONTENT_MODES.all,
  };

  const shareButtonsProps = {
    title,
    shareUrl: getUrlByVideo({ host: WEB_HOSTNAME, video: channel }),
  };

  return (
    <div
      className={classNames(styles.root, {
        [styles.verticalFit]: verticalFit.getValue(),
      })}
      data-test-id="live-player-channel-details"
    >
      <div className={styles.section}>
        <SectionTitle title={formatMessage(messages.guideSectionTitle)} href={WEB_ROUTES.live} />
        <EpgRow channelId={channelId} />
      </div>

      <div className={styles.section}>
        <SectionTitle title={formatMessage(messages.detailsSectionTitle)} />

        <Grid.Container className={styles.detailsBox}>
          <Grid.Item className={styles.logoWrapper} xs={12} sm={12} sMd={4} md={3} lg={3} xxl={2}>
            <div
              className={styles.logo}
              style={{
                backgroundImage: landscapeImg ? toCSSUrl(landscapeImg) : /* istanbul ignore next */ undefined,
              }}
            />
          </Grid.Item>
          <Grid.Item className={styles.content} xs={12} sm={12} sMd={8} md={9} lg={8} xxl={9}>
            <h1>{title}</h1>
            <p>{description}</p>
          </Grid.Item>
          <Grid.Item className={styles.opts} xs={12} sm={12} sMd={12} md={12} lg={1} xxl={1}>
            <ShareButtons {...shareButtonsProps} />
          </Grid.Item>
        </Grid.Container>
      </div>

      <ContainerRow {...rowProps} />
    </div>
  );
};

export default ContentDetails;
