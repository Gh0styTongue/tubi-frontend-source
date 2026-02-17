const ottMapping: Record<OTTPLATFORM, number> = {
  FIRETV_HYB: 0.05,
  TIZEN: 0.3,
  COMCAST: 0.3,
  COMCASTHOSP: 0.3,
  ANDROIDTV: 0.3,
  VIZIO: 0.3,
  LGTV: 0.6,
  NETGEM: 0.6,
  PS4: 0.6,
  XBOXONE: 0.85,
  SONY: 0.85,
  COX: 0.85,
  PS5: 0.85,
  ROGERS: 0.85,
  HISENSE: 0.85,
  SHAW: 0.85,
  TIVO: 0.85,
  HILTON: 0.85,
  DIRECTVHOSP: 0.85,
  BRIDGEWATER: 0.85,
  VERIZONTV: 0.85,
};

export function getDeviceSpecSampleRate(): number {
  const sampleRate = 1;
  if (!__PRODUCTION__ || __IS_ALPHA_ENV__) {
    return sampleRate;
  }
  if (__WEBPLATFORM__ === 'WEB') {
    return 0.15;
  }

  const ottValue = ottMapping[__OTTPLATFORM__ as OTTPLATFORM];
  if (ottValue) {
    return ottValue;
  }

  return sampleRate;
}
