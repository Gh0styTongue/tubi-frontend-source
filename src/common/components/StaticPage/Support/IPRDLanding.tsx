/* istanbul ignore file */
import classNames from 'classnames';
import type { Location } from 'history';
import React, { useCallback, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useSelector } from 'react-redux';
import { browserHistory } from 'react-router';

import { WEB_ROUTES } from 'common/constants/routes';
import type { StoreState } from 'common/types/storeState';
import ComposedSelect from 'web/components/ComposedSelect/ComposedSelect';

import styles from '../StaticPage.scss';

const messages = defineMessages({
  platformSelect: {
    description: 'Platform selection dropdown label',
    defaultMessage: 'Select Platform',
  },
  selectOption: {
    description: 'Default select option text',
    defaultMessage: 'Please select a platform...',
  },
  tubiOption: {
    description: 'Tubi option in dropdown',
    defaultMessage: 'Report IP Issues on Tubi',
  },
  stubiosOption: {
    description: 'Stubios option in dropdown',
    defaultMessage: 'Report IP Issues on Stubios',
  },
});

interface IPRDLandingProps {
  location: Location;
}

const IPRDLanding: React.FunctionComponent<IPRDLandingProps> = () => {
  const intl = useIntl();
  const isMobile = useSelector((state: StoreState) => state.ui.isMobile);
  const containerCls = classNames(styles.formContainer, styles.supportForm, styles.iprdContainer);
  const itemCls = classNames(styles.flexItem);
  const [selectedPlatform, setSelectedPlatform] = useState('');

  const platformOptions = [
    {
      value: '',
      label: intl.formatMessage(messages.selectOption),
    },
    {
      value: 'tubi',
      label: intl.formatMessage(messages.tubiOption),
    },
    {
      value: 'stubios',
      label: intl.formatMessage(messages.stubiosOption),
    },
  ];

  const handlePlatformChange = useCallback((field: string, value: string) => {
    setSelectedPlatform(value);
    browserHistory.push(`${WEB_ROUTES.IPRDLanding}/${value}`);
  }, []);

  const handleFieldError = useCallback(() => {
    // No-op for this component since we don't need field validation
  }, []);

  const handleSelectChange = useCallback((field: string, value: string) => {
    handlePlatformChange(field, value);
  }, [handlePlatformChange]);

  return (
    <div className={containerCls}>
      <div className={itemCls}>
        <ComposedSelect
          fixedLabel
          name="platform"
          label={intl.formatMessage(messages.platformSelect)}
          native={isMobile}
          options={platformOptions}
          value={selectedPlatform}
          handleSelectChange={handleSelectChange}
          setFieldError={handleFieldError}
          // eslint-disable-next-line react/forbid-component-props
          className={styles.selectInput}
        />
      </div>
    </div>
  );
};

/**
 * StaticPage route expects functional component, so wrap the class here
 */
export default ({ location }: { location: Location }) => <IPRDLanding location={location} />;
