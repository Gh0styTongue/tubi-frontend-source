import type { ContentTileProps } from '@tubitv/web-ui';
import { ContentTile } from '@tubitv/web-ui';
import React from 'react';

import { isMatureContentGatedSelector } from 'common/features/authentication/selectors/needsLogin';
import useAppSelector from 'common/hooks/useAppSelector';

const ContentTileWithMatureContentGate = (props: ContentTileProps & { id: string }) => {
  const isMatureContentGated = useAppSelector((state) => isMatureContentGatedSelector(state, props.id));

  const enhancedProps = {
    ...props,
    isLocked: isMatureContentGated,
  };

  return <ContentTile {...enhancedProps} />;
};

export default ContentTileWithMatureContentGate;
