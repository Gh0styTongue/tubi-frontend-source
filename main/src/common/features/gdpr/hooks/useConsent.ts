import { useCallback, useState } from 'react';

import { updateGDPRConsent } from 'common/features/gdpr/actions/consent';
import type { OptionalConsentValue } from 'common/features/gdpr/types';
import { isOptionalConsent } from 'common/features/gdpr/utils';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';

export const useFormConsents = () => {
  const dispatch = useAppDispatch();
  const consents = useAppSelector((state) => state.consent.consents);
  const initialFormValues: Record<string, OptionalConsentValue> = {};
  consents.filter(isOptionalConsent).forEach((consent) => {
    initialFormValues[consent.key] = consent.value as OptionalConsentValue;
  });
  const [formValues, setFormValues] = useState(initialFormValues);
  const onConsentChange = useCallback(
    (key: string, value: OptionalConsentValue) => {
      setFormValues({
        ...formValues,
        [key]: value,
      });
    },
    [formValues]
  );
  const onConsentsSave = useCallback(() => dispatch(updateGDPRConsent(formValues)), [dispatch, formValues]);
  return {
    formValues,
    onConsentChange,
    onConsentsSave,
  };
};

export const useOneClickConsent = () => {
  const dispatch = useAppDispatch();
  const consents = useAppSelector((state) => state.consent.consents);

  const updateAll = useCallback(
    (value: OptionalConsentValue) => {
      const updatedConsent = {};
      consents.filter(isOptionalConsent).forEach((consent) => {
        updatedConsent[consent.key] = value;
      });
      return dispatch(updateGDPRConsent(updatedConsent)) as Promise<unknown>;
    },
    [dispatch, consents]
  );
  const onAcceptAll = useCallback(() => updateAll('opted_in'), [updateAll]);
  const onRejectAll = useCallback(() => updateAll('opted_out'), [updateAll]);

  return {
    onAcceptAll,
    onRejectAll,
  };
};
