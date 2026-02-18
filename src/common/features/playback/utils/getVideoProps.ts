import { DrmKeySystem } from '@adrise/player';

import { FAIRPLAY_SERVER_CERT_URL } from 'common/constants/player';
import type { HDCPVersion, VideoResource } from 'common/types/video';
import { getRemoteConfig } from 'common/utils/remoteConfig';

export interface VideoProps {
  drmKeySystem?: DrmKeySystem | undefined;
  licenseUrl?: string | undefined;
  serverCertificateUrl?: string | undefined;
  mediaUrl: string;
  hdcpVersion?: HDCPVersion | undefined;
}

export const getVideoProps = (videoResource?: VideoResource): VideoProps => {
  const mediaUrl = videoResource?.manifest?.url;

  const licenseUrl = videoResource?.license_server?.url;
  const hdcpVersion = videoResource?.license_server?.hdcp_version;
  let drmKeySystem;
  let serverCertificateUrl;
  if (licenseUrl && videoResource) {
    const { type } = videoResource;
    if (type.includes('widevine')) {
      drmKeySystem = DrmKeySystem.Widevine;
    } else if (type.includes('playready')) {
      drmKeySystem = DrmKeySystem.PlayReady;
    } else if (type.includes('fairplay')) {
      drmKeySystem = DrmKeySystem.FairPlay;
      const fairplayCertUrl = getRemoteConfig().fairplay_cert_url;
      serverCertificateUrl = fairplayCertUrl || FAIRPLAY_SERVER_CERT_URL;
    }
  }

  return {
    drmKeySystem,
    licenseUrl,
    serverCertificateUrl,
    mediaUrl: mediaUrl ?? '',
    hdcpVersion,
  };
};
