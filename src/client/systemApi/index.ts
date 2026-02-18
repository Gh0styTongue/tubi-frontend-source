import type BaseSystemApi from 'client/systemApi/systemApi';

export function getSystemApi(): new () => BaseSystemApi {
  if (__WEBPLATFORM__) return require('client/systemApi/web').default;
  if (__IS_ANDROIDTV_HYB_PLATFORM__) return require('client/systemApi/androidtv').default;
  if (__IS_COMCAST_PLATFORM_FAMILY__) return require('client/systemApi/comcast-family').default;
  if (__OTTPLATFORM__ === 'FIRETV_HYB') return require('client/systemApi/firetv-hyb').default;
  if (__OTTPLATFORM__ === 'HISENSE') return require('client/systemApi/hisense').default;
  if (__OTTPLATFORM__ === 'LGTV') return require('client/systemApi/lgtv').default;
  if (__OTTPLATFORM__ === 'PS4') return require('client/systemApi/ps4').default;
  if (__OTTPLATFORM__ === 'PS5') return require('client/systemApi/ps5').default;
  if (__OTTPLATFORM__ === 'TIZEN') return require('client/systemApi/tizen').default;
  if (__OTTPLATFORM__ === 'TIVO') return require('client/systemApi/tivo').default;
  if (__OTTPLATFORM__ === 'VIZIO') return require('client/systemApi/vizio').default;
  if (__OTTPLATFORM__ === 'XBOXONE') return require('client/systemApi/xboxone').default;
  return class DefaultSystemApi extends require('client/systemApi/systemApi').default {};
}

const Class = getSystemApi();

export default new Class();
