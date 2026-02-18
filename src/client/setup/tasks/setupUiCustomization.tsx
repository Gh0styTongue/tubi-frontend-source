import getApiConfig from 'common/apiConfig';
import { SET_STATIC_CONFIG } from 'common/constants/action-types';
import type ApiClient from 'common/helpers/ApiClient';
import logger from 'common/helpers/logging';
import type { TubiStore } from 'common/types/storeState';

export const setupUiCustomization = async (store: TubiStore, client: ApiClient) => {
  try {
    const url = `${getApiConfig().tensorPrefix}/ui_customization/static_config`;
    const json = await client.get(url);
    store.dispatch({
      type: SET_STATIC_CONFIG,
      payload: json,
    });
  } catch (error) {
    logger.error('Error fetching ui customization schema', error);
  }
};
