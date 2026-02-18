import { getOTTRemote } from 'common/utils/keymap';
import { PHILIPS_BRAND, TITANOS_JVC_BACK_KEY, TITANOS_PHILIPS_BACK_KEY } from 'ott/constants/titanos';

const remote = getOTTRemote();

export const setupTitanOsBackButton = async () => {
  const sdk = window.TitanSDK;

  // We can't do this directly in `src/common/constants/key-map.ts` because it
  // has to happen asynchronously, so we do it here.
  if (sdk) {
    await sdk.isReady;
    const deviceInfo = await sdk.deviceInfo.getDeviceInfo();
    const brand = deviceInfo.Channel?.brand;

    // Mutates the remote object directly (to keep the reference) so that any
    // modules who called `getOTTRemote()` in module scope will get the updated
    // back button. This helps us avoid making the whole chain of function calls
    // async.
    remote.back = brand === PHILIPS_BRAND ? TITANOS_PHILIPS_BACK_KEY : TITANOS_JVC_BACK_KEY;
  }
};
