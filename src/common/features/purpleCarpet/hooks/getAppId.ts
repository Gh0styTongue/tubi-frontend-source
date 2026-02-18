import systemApi from 'client/systemApi';
import type LGTVSystemApi from 'client/systemApi/lgtv';
import type SamsungSystemApi from 'client/systemApi/tizen';

const getAppId = (): string | undefined => {
  if (__OTTPLATFORM__ === 'TIZEN') {
    return (systemApi as SamsungSystemApi).getAppId();
  }

  if (__OTTPLATFORM__ === 'LGTV') {
    return (systemApi as LGTVSystemApi).getAppId();
  }

  return undefined;
};

export default getAppId;
