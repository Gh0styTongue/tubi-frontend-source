import React, { useMemo } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import RefreshFluidGrid from 'web/rd/components/FluidGrid/FluidGrid';

import styles from './Search.scss';

const messages = defineMessages({
  recommendationsHeading: {
    description:
      'Heading shown when there are no results returned for the search query but we want to show some recommended titles instead',
    defaultMessage: 'No matches, but here are some recommendations',
  },
  noMatchesHeading: {
    description:
      'Heading shown when there are no results returned for the search query',
    defaultMessage: 'No matches',
  },
  oopsNoMatch: {
    description: 'Heading shown when there are no results returned for the search query',
    defaultMessage: 'Oops! No Matches',
  },
  tryDifferent: {
    description: 'Description shown when there are no results returned for the search query',
    defaultMessage: 'Try looking for something different.',
  },
});

export interface ResultSectionProps {
  items: string[];
  hasSearchResult: boolean;
  trackClick: (index: number, contentId: string) => void;
  personalizationId?: string;
  containerId?: string;
}

const ResultSection: React.FC<ResultSectionProps> = React.memo(
  ({ items, hasSearchResult, trackClick, personalizationId, containerId }) => {
    const intl = useIntl();

    const fluidGrid = useMemo(() => (
      <RefreshFluidGrid
        contentIds={items}
        trackCb={trackClick}
        showProgress
        personalizationId={personalizationId}
        containerId={containerId}
      />
    ), [items, trackClick, personalizationId, containerId]);

    if (hasSearchResult) {
      return (
        <div className={styles.groupSection}>
          {fluidGrid}
        </div>
      );
    } if (items.length) {
      return (
        <div className={styles.groupSection}>
          <h2 className={styles.sectionTitle}>
            {intl.formatMessage(messages.recommendationsHeading)}
          </h2>
          {fluidGrid}
        </div>
      );
    }

    return (
      <div className={styles.noMatchContainer}>
        <h2 className={styles.noMatchTitle}>{intl.formatMessage(messages.oopsNoMatch)}</h2>
        <p className={styles.noMatchDescription}>{intl.formatMessage(messages.tryDifferent)}</p>
      </div>
    );
  });

export default ResultSection;
