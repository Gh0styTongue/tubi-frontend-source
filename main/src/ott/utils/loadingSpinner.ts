import { MAIN_LOADING_SPINNER_ID } from 'common/constants/dom';

export const hideLoadingSpinner = () => {
  const mainLoadingSpinner = document.getElementById(MAIN_LOADING_SPINNER_ID);
  mainLoadingSpinner?.parentElement?.removeChild(mainLoadingSpinner);
};
