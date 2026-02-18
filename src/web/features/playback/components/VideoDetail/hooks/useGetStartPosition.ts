import { useLocation } from 'common/context/ReactRouterModernContext';
import useAppSelector from 'common/hooks/useAppSelector';
import { byIdSelector, contentHistoryByContentIdSelector } from 'common/selectors/video';
import { getResumeInfo } from 'common/utils/getResumeInfo';
import { castReceiverPoitionSelector } from 'web/features/playback/selectors/chromecast';

interface UseGetStartPositionParams {
  contentId: string;
}

export const useGetStartPosition = ({ contentId }: UseGetStartPositionParams): { startPosition: number } => {
  const location = useLocation();
  const startPosFromQuery = location.query.startPos;

  const history = useAppSelector((state) => contentHistoryByContentIdSelector(state, contentId));
  const byId = useAppSelector(byIdSelector);

  const { position } = getResumeInfo({ history, contentId, byId, isSeries: false });
  const startPositionFromState = Math.max(position, 0);

  const receiverPosition = useAppSelector(castReceiverPoitionSelector);

  // We check `receiverPosition` first because we want to resume from the last position it stops after casting from chromecast.
  return {
    startPosition:
      receiverPosition ||
      (typeof startPosFromQuery === 'string' && parseInt(startPosFromQuery, 10)) ||
      startPositionFromState,
  };
};
