import { useEffect, useRef, useState } from 'react';

import { trackPauseQrCodeGenerationFailure } from 'client/features/playback/track/client-log/trackPauseQrCodeGenerationFailure';
import useAppSelector from 'common/hooks/useAppSelector';
import { deviceIdSelector } from 'common/selectors/deviceId';
import type { Video } from 'common/types/video';
import { makeDeeplinkQrCode } from 'web/features/playback/components/WebPlayerOverlay/PauseQrCode/tools/makeDeeplinkQrCode';

interface UsePauseQrCodeProps {
  isPauseEligible: boolean;
  video: Video
}

export const usePauseQrCode = ({ isPauseEligible, video }: UsePauseQrCodeProps) => {
  const deviceId = useAppSelector(deviceIdSelector);

  // this can be set to a URL once and never unset
  // needs to be state and not a ref because it can drive re-rendering
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');

  // this can only ever be set to true and never unset
  // does not need to drive render
  const didErrorRef = useRef(false);
  useEffect(() => {
    const generateQrCode = async () => {
      if (isPauseEligible && !qrCodeDataUrl && !didErrorRef.current) {
        try {

          const dataURL = await makeDeeplinkQrCode({ deviceId, video });

          setQrCodeDataUrl(dataURL);
        } catch (error) {
          trackPauseQrCodeGenerationFailure({ error });
          didErrorRef.current = true;
        }
      }
    };
    generateQrCode();
  }, [isPauseEligible, qrCodeDataUrl, deviceId, video]);

  return {
    qrCodeDataUrl,
  };
};
