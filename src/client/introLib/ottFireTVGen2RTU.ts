/* istanbul ignore file */
const FIRETV_TITLE_TREATMENT = {
  namespace: 'webott_firetv_gen2_rtu_v1',
  parameter: 'enable_static_image',
};

export const getConfig = () => {
  return {
    ...FIRETV_TITLE_TREATMENT,
    id: 'webott_firetv_gen2_rtu_v1',
    experimentName: 'webott_firetv_gen2_rtu_v1',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'enable_static_image', value: true },
    ],
    enabledSelector: () => {
      return __OTTPLATFORM__ === 'FIRETV_HYB';
    },
    inYoubora: false,
  };
};
