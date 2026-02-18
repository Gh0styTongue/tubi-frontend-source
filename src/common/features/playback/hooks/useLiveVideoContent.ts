import useAppSelector from 'common/hooks/useAppSelector';
import { useContent } from 'common/hooks/useContent/useContent';
import { liveVideoSelector } from 'common/selectors/webLive';

export const useLiveVideoContent = (contentId: string) => {
  const { data: video } = useContent(contentId);
  const liveVideo = useAppSelector(state => liveVideoSelector(state, contentId));
  return liveVideo || video;
};
