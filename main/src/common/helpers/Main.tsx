import type { FC, ReactElement } from 'react';
import React, { useEffect, useRef } from 'react';
import type { FilledContext } from 'react-helmet-async';
import { HelmetProvider } from 'react-helmet-async';
import { RawIntlProvider } from 'react-intl';
import { Provider as ReduxProvider } from 'react-redux';

import { ExperimentStoreProvider } from 'common/experiments/ExperimentStoreContext';
import type { TubiStore } from 'common/types/storeState';
import type { LanguageLocaleType } from 'i18n/constants';
import { getIntl } from 'i18n/intl';

const Main: FC<{
  store: TubiStore;
  router: ReactElement;
  languageLocale: LanguageLocaleType;
  onMount?: (value?: unknown) => void;
  helmetContext?: FilledContext;
}> = ({ store, router, languageLocale, onMount, helmetContext }) => {
  const intlObj = getIntl(languageLocale);
  const isMountedRef = useRef(false);

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      onMount?.();
    }
  }, [onMount]);

  return (
    <HelmetProvider context={helmetContext}>
      <ReduxProvider store={store} key="provider">
        <RawIntlProvider value={intlObj} key={languageLocale}>
          <ExperimentStoreProvider store={store}>
            {router}
          </ExperimentStoreProvider>
        </RawIntlProvider>
      </ReduxProvider>
    </HelmetProvider>
  );
};

export default Main;
