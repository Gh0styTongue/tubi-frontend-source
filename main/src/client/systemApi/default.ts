import type BaseSystemApi from 'client/systemApi/systemApi';

let systemApi: undefined | BaseSystemApi;

export function setSystemApi(api: undefined | BaseSystemApi): void {
  systemApi = api;
}

export function getSystemApi(): BaseSystemApi {
  if (systemApi === undefined) {
    throw new Error('accessing system api prior to initialization');
  }
  return systemApi;
}

