import { getExperiment } from 'common/experimentV2';
import webottMajorUseStoreContentData from 'common/experimentV2/configs/webottMajorUseStoreContentData';

export const isUseStoreContentDataSelector = () => {
  const value = getExperiment(webottMajorUseStoreContentData)?.get('use_store_content_data_v1');
  return !!value;
};
