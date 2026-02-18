import type { ExperimentDescriptor } from './types';

const webottMajorUseStoreContentData: ExperimentDescriptor<{
  use_store_content_data_v1: false | true;
}> = {
  name: 'webott_major_platforms_use_store_content_data_v1',
  defaultParams: {
    use_store_content_data_v1: false,
  },
};

export default webottMajorUseStoreContentData;
