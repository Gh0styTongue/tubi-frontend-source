export const setupMSW = async () => {
  if (!__IS_MOCKING_ENABLED__) {
    return;
  }

  const { startWorker } = await import(/* webpackChunkName: "msw-mocks" */ 'mocks/browser');
  return startWorker();
};
