import type { BreakpointProps } from '@tubitv/web-ui';
import React, { useEffect, useMemo } from 'react';

import { loadContainer } from 'common/actions/container';
import { setTileIndexInContainer } from 'common/actions/ui';
import type { CONTENT_MODE_VALUE } from 'common/constants/constants';
import { CONTAINER_TYPES, FREEZED_EMPTY_ARRAY, FREEZED_EMPTY_FUNCTION } from 'common/constants/constants';
import { useLocation } from 'common/context/ReactRouterModernContext';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import { containerSelector } from 'common/selectors/container';
import { getWebEpgUrl } from 'common/utils/epg';
import { getContainerUrl } from 'common/utils/urlConstruction';
import type { StoreContainerPositionParams } from 'web/rd/components/HomeContainerRow/HomeContainerRow';
import HomeContainerRow from 'web/rd/components/HomeContainerRow/HomeContainerRow';

export type ContainerRowProps = {
  id: string;
  className?: string;
  breakpoints?: BreakpointProps;
  title?: string;
  forceCurrentMode?: CONTENT_MODE_VALUE;
};

const ContainerRow = ({ id, className, breakpoints, title, forceCurrentMode }: ContainerRowProps) => {
  const location = useLocation();
  /* istanbul ignore next */
  const { containerIdMap = {}, containerChildrenIdMap = {} } = useAppSelector((state) =>
    containerSelector(state, { forceCurrentMode, pathname: location.pathname })
  );
  /* istanbul ignore next */
  const { title: containerTitle, slug, type } = containerIdMap[id] || {};
  /* istanbul ignore next */
  const containerContents = useMemo(
    () => containerChildrenIdMap[id] || FREEZED_EMPTY_ARRAY,
    [containerChildrenIdMap, id]
  );
  const to = type === CONTAINER_TYPES.LINEAR ? getWebEpgUrl(id) : getContainerUrl(id, { type });
  const dispatch = useAppDispatch();
  const storeContainerPosition = /* istanbul ignore next */ ({ index, containerId }: StoreContainerPositionParams) => {
    dispatch(setTileIndexInContainer({ index, containerId, shouldDisablePreviewsWhileScrolling: false }));
  };

  useEffect(() => {
    if (!containerContents.length) {
      dispatch(loadContainer({ location, id, expand: 0, limit: 12 }));
    }
  }, [containerContents, dispatch, id, location]);

  return containerContents.length ? (
    <HomeContainerRow
      breakpoints={breakpoints}
      className={className}
      containerId={id}
      containerSlug={slug}
      containerTitle={title || containerTitle}
      containerType={type}
      containerHref={to}
      containerPosition={0}
      containerContents={containerContents}
      initialIndex={0}
      onStoreContainerPosition={storeContainerPosition}
      onLoadMore={FREEZED_EMPTY_FUNCTION}
      onCarouselIndexChange={FREEZED_EMPTY_FUNCTION}
      onNavigation={FREEZED_EMPTY_FUNCTION}
    />
  ) : null;
};

export default ContainerRow;
