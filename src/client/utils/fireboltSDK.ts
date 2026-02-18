import type FireboltSDK from '@firebolt-js/sdk';

type FireboltSDKType = typeof FireboltSDK;

declare global {
  interface Window {
    fireboltSDK?: FireboltSDKType;
  }
}

export const loadFireboltSDK = async () => {
  if (!__CLIENT__ || !__IS_COMCAST_PLATFORM_FAMILY__) {
    throw new Error('FireboltSDK is not available');
  }

  const fireboltSDK = await import(/* webpackChunkName: "firebolt-sdk" */ '@firebolt-js/sdk');

  if (__STAGING__ || __DEVELOPMENT__) {
    window.fireboltSDK = fireboltSDK;
  }

  return fireboltSDK;
};
