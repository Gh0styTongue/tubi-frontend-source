import { setCookie } from 'client/utils/localDataStorage';

export const setDeviceResolution = () => {

  const w = window.screen.width * window.devicePixelRatio;

  const h = window.screen.height * window.devicePixelRatio;
  setCookie('DEVICE_RESOLUTION', `${w}x${h}`);
};
