import useAppSelector from 'common/hooks/useAppSelector';
import { castReceiverStateSelector } from 'web/features/playback/selectors/chromecast';

export const useIsCasting = (): {isCasting: boolean} => {
  const castReceiverState = useAppSelector(castReceiverStateSelector);
  return {
    // We can ignore this rule here because of the type check for window
    // eslint-disable-next-line tubitv/no-dom-globals-in-react-hooks
    isCasting: !!(typeof window !== 'undefined' && window.cast && (castReceiverState === window.cast.framework.CastState.CONNECTED)),
  };
};
