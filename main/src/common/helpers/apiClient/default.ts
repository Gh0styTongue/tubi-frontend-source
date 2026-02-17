import type ApiClient from 'common/helpers/ApiClient';

let apiClient: typeof ApiClient | undefined;

export function setApiClient(client: typeof ApiClient | undefined) {
  apiClient = client;
}

export function getApiClient(): typeof ApiClient {
  if (apiClient === undefined) {
    throw new Error('apiClient dependency not injected');
  }
  return apiClient;
}
