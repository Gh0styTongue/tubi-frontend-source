import windowsInstallBanner from './windowsInstallBanner';

// calculate which banner to display and the priority of each banner
export const getActiveBanner = () => {
  if (windowsInstallBanner.canShow()) {
    return windowsInstallBanner;
  }
  return null;
};
