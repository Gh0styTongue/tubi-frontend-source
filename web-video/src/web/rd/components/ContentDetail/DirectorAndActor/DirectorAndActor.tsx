import { ANALYTICS_COMPONENTS } from '@tubitv/analytics/lib/components';
import { ATag } from '@tubitv/web-ui';
import classnames from 'classnames';
import type { FC } from 'react';
import React from 'react';
import { defineMessages } from 'react-intl';

import { storeSrcPath } from 'common/actions/search';
import useAppDispatch from 'common/hooks/useAppDispatch';
import trackingManager from 'common/services/TrackingManager';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { useIntl } from 'i18n/intl';
import { getPersonPath } from 'web/features/person/utils/person';

import styles from './DirectorAndActor.scss';

const messages = defineMessages({
  director: {
    description: 'director list',
    defaultMessage: 'Directed by',
  },
  starring: {
    description: 'actor list',
    defaultMessage: 'Starring',
  },
});

export interface DirectorAndActorProps {
  actors?: string[];
  className?: string;
  directors?: string[];
}

const DirectorAndActor: FC<DirectorAndActorProps> = ({ actors = [], className, directors = [] }) => {
  const dispatch = useAppDispatch();
  const { formatMessage } = useIntl();

  const handleClick = (castMember: string) => {
    trackingManager.createNavigateToPageComponent({
      actorName: castMember,
      componentType: ANALYTICS_COMPONENTS.castListComponent,
    });
    dispatch(storeSrcPath(getCurrentPathname()));
  };

  const parseCastLinks = (castMembers: string[]) => {
    return castMembers.map((castMember) => {
      if (castMember === 'N/A') {
        return castMember;
      }

      return (
        <ATag to={getPersonPath(castMember)} key={castMember} onClick={() => handleClick(castMember)}>
          {castMember}
        </ATag>
      );
    });
  };

  return (
    <div className={classnames(styles.directorAndStarring, className)}>
      {actors?.length ? (
        <div className={styles.line}>
          {/* eslint-disable-next-line react/jsx-no-literals -- no i18n needed for punctuation */}
          <span className={styles.label}>{formatMessage(messages.starring)}:</span>
          <span className={styles.castText}>{parseCastLinks(actors)}</span>
        </div>
      ) : null}
      {directors?.length ? (
        <div className={styles.line}>
          {/* eslint-disable-next-line react/jsx-no-literals -- no i18n needed for punctuation */}
          <span className={styles.label}>{formatMessage(messages.director)}:</span>
          <span className={styles.castText}>{parseCastLinks(directors)}</span>
        </div>
      ) : null}
    </div>
  );
};

export default DirectorAndActor;
