import type ApiClient from 'common/helpers/ApiClient';
import configureStore from 'common/store/configureStore';

export const createReduxStore = (client: InstanceType<typeof ApiClient>) => {
  const initialState = (window as Window).__data;
  return configureStore(client, initialState);
};
