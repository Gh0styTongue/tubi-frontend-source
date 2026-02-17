import type { BreakpointProps } from '@tubitv/web-ui';
import { useInView } from '@tubitv/web-ui';
import classnames from 'classnames';
import type { FC } from 'react';
import React, { memo, useEffect } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import type { MessageDescriptor } from 'react-intl';

import {
  CONTAINER_ID_FOR_RELATED_RANKING,
  CONTAINER_ID_FOR_RELATED_RANKING_CELEBRITY,
} from 'common/constants/constants';
import WebCelebrityYmal from 'common/experiments/config/webCelebrityYmal';
import useAppSelector from 'common/hooks/useAppSelector';
import useExperiment from 'common/hooks/useExperiment';
import { relatedContentsRowSelector } from 'common/selectors/video';
import type StoreState from 'common/types/storeState';

import styles from './RelatedContents.scss';
import RelatedContentsRow from './RelatedContentsRow';

export const messages = defineMessages({
  contentRowTitle: {
    description: 'heading for "You May Also Like" row',
    defaultMessage: 'You May Also Like',
  },
  celebrityRowTitle: {
    description: 'heading for "From the Cast and Crew" row',
    defaultMessage: 'From the Cast and Crew',
  },
});

export interface RelatedContentsProps {
  breakpoints?: BreakpointProps,
  contentId: string;
  isVertical?: boolean;
  className?: string;
  limit?: number;
  isContentUnavailable?: boolean;
}

const containerSlugs: Record<string, string> = {
  [CONTAINER_ID_FOR_RELATED_RANKING]: 'ymal',
  [CONTAINER_ID_FOR_RELATED_RANKING_CELEBRITY]: 'from_cast_and_crew',
};

const containerTitles: Record<string, MessageDescriptor> = {
  [CONTAINER_ID_FOR_RELATED_RANKING]: messages.contentRowTitle,
  [CONTAINER_ID_FOR_RELATED_RANKING_CELEBRITY]: messages.celebrityRowTitle,
};

const rowIds = [CONTAINER_ID_FOR_RELATED_RANKING_CELEBRITY, CONTAINER_ID_FOR_RELATED_RANKING];

const RelatedContents: FC<RelatedContentsProps> = ({
  contentId,
  className,
  limit,
  isContentUnavailable,
  isVertical,
  breakpoints,
}) => {
  const intl = useIntl();
  const webCelebrityYmal = useExperiment(WebCelebrityYmal);
  const isContentAvailable = Boolean(!isContentUnavailable);
  const showCelebrityYmal = webCelebrityYmal.getValue() && isContentAvailable;

  const relatedContents = useAppSelector((state: StoreState) => relatedContentsRowSelector(
    state,
    contentId,
    rowIds,
    limit,
  ));
  // it's possible that for some titles, ML doesn't have celebrity related recommentation
  // we wouldn't log exposure if users are visiting those titles
  const hasCelebrityRow = !!relatedContents.find(({ id }) => id === CONTAINER_ID_FOR_RELATED_RANKING_CELEBRITY);

  const { refCallback, isInView } = useInView();
  useEffect(() => {
    if (isInView && isContentAvailable && hasCelebrityRow) {
      webCelebrityYmal.logExposure();
    }
  }, [isInView, isContentAvailable, hasCelebrityRow, webCelebrityYmal]);

  const rowsToRender = showCelebrityYmal ? relatedContents : relatedContents.filter(({ id }) => id === CONTAINER_ID_FOR_RELATED_RANKING);
  const rows = rowsToRender.map(({ contents: contentIds, id }) => {
    /* istanbul ignore next */
    if (!contentIds?.length) {
      return null;
    }
    return (
      <RelatedContentsRow
        key={id}
        contentId={contentId}
        contentIds={contentIds}
        title={intl.formatMessage(containerTitles[id])}
        containerSlug={containerSlugs[id]}
        breakpoints={breakpoints}
        isVertical={isVertical}
      />
    );
  });

  return (
    <div className={classnames(styles.relatedContents, className)} ref={refCallback}>
      {rows}
    </div>
  );
};

export default memo(RelatedContents);
