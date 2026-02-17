import { Container, Button } from '@tubitv/web-ui';
import classNames from 'classnames';
import React, { useCallback, useRef, useState } from 'react';

import { CONTAINER_TYPES, HISTORY_CONTAINER_ID } from 'common/constants/constants';
import * as eventTypes from 'common/constants/event-types';
import {
  LANDSCAPE_TILE_SIZE,
} from 'common/constants/style-constants';
import useAppSelector from 'common/hooks/useAppSelector';
import { shouldShowPersonalizationPromptSelector } from 'common/selectors/experiments/webPersonalizationPrompt';
import { buildComponentInteractionEvent } from 'common/utils/analytics';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { trackEvent } from 'common/utils/track';
import { ShortFormFluidGrid } from 'web/components/FluidGrids';
import RefreshFluidGrid from 'web/rd/components/FluidGrid/FluidGrid';

import styles from './WebContainer.scss';

const SHOULD_SHOW_CONTINUE_BUTTON_MIN_SIZE = 3;

type WebContainerProps = {
  title: string;
  items?: string[];
  description: string;
  type: string;
  id: string;
  trackCb: (idx: number, id: string) => void;
  isMobile: boolean;
  isLikedSelectableTile?: boolean;
  likeContinueButtonText?: string;
  handleClickLikeContinue?: (likedContentIds: Set<string>) => void;
};
const WebContainer: React.FunctionComponent<WebContainerProps> = ({
  title,
  items = [],
  description,
  type,
  id,
  trackCb,
  isMobile,
  isLikedSelectableTile,
  likeContinueButtonText,
  handleClickLikeContinue,
}) => {
  const fluidGridProps = { id, containerId: id, items, trackCb, isMobile };
  const tileOrientation = 'portrait';
  const likedContentIds = useRef<Set<string>>(new Set());
  const [continueButtonIsLoading, setContinueButtonIsLoading] = useState(false);
  const [likedContentIdSize, setLikedContentIdSize] = useState(likedContentIds.current.size);
  const shouldShowContinueButton = likedContentIdSize >= SHOULD_SHOW_CONTINUE_BUTTON_MIN_SIZE;
  const shouldShowPersonalizationPrompt = useAppSelector(shouldShowPersonalizationPromptSelector);

  const handleLikeClick = useCallback((contentId: string | undefined, liked: boolean) => {
    if (contentId) {
      if (liked) {
        likedContentIds.current.add(contentId);
      } else {
        likedContentIds.current.delete(contentId);
      }
      if (shouldShowPersonalizationPrompt) {
        const eventObject = buildComponentInteractionEvent({
          pathname: getCurrentPathname(),
          userInteraction: liked ? 'TOGGLE_ON' : 'TOGGLE_OFF',
          component: 'TILE',
          extraCtx: { isOnboardingCategoryPage: true },
        });
        trackEvent(eventTypes.COMPONENT_INTERACTION_EVENT, eventObject);
      }
    }
    setLikedContentIdSize(likedContentIds.current.size);
  }, [shouldShowPersonalizationPrompt]);

  const handleContinueClick = useCallback(() => {
    setContinueButtonIsLoading(true);
    handleClickLikeContinue?.(likedContentIds.current);
  }, [handleClickLikeContinue]);

  let gridComponent;
  if (type === CONTAINER_TYPES.SHORT_FORM) {
    gridComponent = (
      <ShortFormFluidGrid
        largeTile
        {...fluidGridProps}
        {...LANDSCAPE_TILE_SIZE}
      />
    );
  } else {
    // type is 'regular'
    gridComponent = <RefreshFluidGrid
      showProgress={id === HISTORY_CONTAINER_ID}
      contentIds={items}
      trackCb={trackCb}
      containerId={id}
      tileOrientation={tileOrientation}
      isLikedSelectableTile={isLikedSelectableTile}
      handleLikeClick={handleLikeClick}
    />;
  }
  return (
    <Container className={styles.content}>
      <div className={classNames(styles.detailContainer, styles.withRefresh)}>
        <h1 className={classNames(styles.title, styles.withRefresh)}>{title}</h1>
        <h2 className={classNames(styles.description, styles.withRefresh)}>{description}</h2>
      </div>
      {gridComponent}
      {isLikedSelectableTile && shouldShowContinueButton ? (
        <div className={styles.containerBottomActionRow}>
          <Button loading={continueButtonIsLoading} onClick={handleContinueClick} className={styles.continueButton}>
            {likeContinueButtonText}
          </Button>
        </div>
      ) : null}
    </Container>
  );
};
export default WebContainer;
