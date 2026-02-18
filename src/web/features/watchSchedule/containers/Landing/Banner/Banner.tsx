import { responsiveMap, Attributes } from '@tubitv/web-ui';
import pick from 'lodash/pick';
import React, { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { Link } from 'react-router';

import Tubi from 'common/components/uilib/SvgLibrary/Tubi';
import { WEB_ROUTES } from 'common/constants/routes';
import useAppSelector from 'common/hooks/useAppSelector';
import { formatSrcSet } from 'common/utils/imageResolution';
import TruncatedText from 'web/components/TruncatedText/TruncatedText';
import { METADATA } from 'web/features/watchSchedule/constants/landing';
import { titleSelector, titleParamSelector } from 'web/features/watchSchedule/selectors/landing';
import { assetsGenerator } from 'web/features/watchSchedule/utils/landing';

import styles from './Banner.scss';
import messages from './bannerMessages';
import ProgramDetail from './ProgramDetail/ProgramDetail';

const Banner = () => {
  const { formatMessage } = useIntl();
  const title = useAppSelector(titleSelector);
  const titleParam = useAppSelector(titleParamSelector);
  const titleAssets = useMemo(() => assetsGenerator(titleParam), [titleParam]);
  const metadata = METADATA[titleParam];
  const { seasonInfo } = metadata;

  const attributesProps = seasonInfo
    ? {
      label: <span className={styles.text}>{[metadata.year, seasonInfo, ...metadata.tags].join(' · ')}</span>,
      ...pick(metadata, ['rating']),
    }
    : null;

  const desktopSrcSet = formatSrcSet(
    [
      [0, titleAssets('desktop-banner-bg@1x.jpg')],
      [2, titleAssets('desktop-banner-bg@2x.jpg')],
    ],
    'x'
  );
  const mobileSrcSet = formatSrcSet(
    [
      [0, titleAssets('mobile-banner-bg@1x.jpg')],
      [2, titleAssets('mobile-banner-bg@2x.jpg')],
    ],
    'x'
  );
  const bgImgProps = {
    loading: 'lazy' as const,
    alt: '',
    srcSet: mobileSrcSet,
  };

  return (
    <div className={styles.root}>
      <div className={styles.bg}>
        <picture>
          <source srcSet={desktopSrcSet} media={responsiveMap.md} />
          {
            // eslint-disable-next-line jsx-a11y/no-redundant-roles
            [<img {...bgImgProps} role="img" />]
          }
        </picture>
        <div className={styles.overlay} />
      </div>

      <div className={styles.main}>
        <h1>{title}</h1>

        <div className={styles.metadata}>
          {attributesProps && <Attributes {...attributesProps} />}
          <TruncatedText maxLine={5} readMoreText={formatMessage(messages.readMore)}>
            {metadata.description?.split('\n').map((line, idx) => <p key={idx}>{line}</p>)}
          </TruncatedText>
        </div>

        <ProgramDetail />

        <Link className={styles.brandWrapper} target="_blank" to={WEB_ROUTES.home}>
          <div className={styles.glowTop} />
          <div className={styles.glowBottom} />
          <div className={styles.brand}>
            <Tubi className={styles.logo} />
            <p>{formatMessage(messages.brandSlogan)}</p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Banner;
