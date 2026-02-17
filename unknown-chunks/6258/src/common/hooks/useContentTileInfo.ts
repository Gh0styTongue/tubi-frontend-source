import type { TileOrientation } from '@tubitv/web-ui';
import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { useSelector } from 'react-redux';

import { uiSelector } from 'common/selectors/ui';
import { byIdSelector } from 'common/selectors/video';
import type { Video } from 'common/types/video';
import type { ContentTileInfo } from 'common/utils/contentTileInfo';
import { getContentTileInfo } from 'common/utils/contentTileInfo';

interface Props {
  content?: Video;
  tileOrientation?: TileOrientation;
  showLinearProgramsInRows?: boolean;
}

const useContentTileInfo = ({
  content,
  tileOrientation,
  showLinearProgramsInRows,
}: Props) => {
  const { formatMessage } = useIntl();
  const byId = useSelector(byIdSelector);
  const { currentDate, userLanguageLocale } = useSelector(uiSelector);

  const contentTileInfo = useMemo(() => {
    if (content) {
      return getContentTileInfo({
        content,
        byId,
        currentDate,
        formatMessage,
        userLanguageLocale,
        showLinearProgramsInRows,
        tileOrientation,
      });
    }
    return {} as ContentTileInfo;
  }, [byId, content, currentDate, formatMessage, showLinearProgramsInRows, tileOrientation, userLanguageLocale]);

  return contentTileInfo;
};

export default useContentTileInfo;
