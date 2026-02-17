import type { FormikBag, FormikProps } from 'formik';
import { withFormik } from 'formik';
import React, { Component } from 'react';
import type { IntlShape } from 'react-intl';
import { injectIntl, defineMessages, FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';

import { changePassword } from 'common/features/authentication/actions/auth';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type StoreState from 'common/types/storeState';
import { validatePasswords } from 'common/utils/form';

import styles from './ChangePassword.scss';
import ChangePasswordForm from './ChangePasswordForm/ChangePasswordForm';

export const messages = defineMessages({
  success: {
    description: 'change password success message',
    defaultMessage: 'You have updated your password successfully.',
  },
  change: {
    description: 'change password submit button text',
    defaultMessage: 'Change Password',
  },
});

interface OwnProps {
  fieldCls?: string;
  email?: string;
  hasPassword?: boolean;
  isSubmitting?: boolean;
  useRefreshStyle?: boolean;
}

interface StateProps {
  hasPassword: boolean;
}

interface InjectedProps {
  dispatch: TubiThunkDispatch;
  intl: IntlShape;
}

type FormValues = {
  currentPassword: string;
  newPassword: string;
  newPassword2: string;
};

type Props = OwnProps & StateProps & InjectedProps;

export class ChangePassword extends Component<Props & FormikProps<FormValues>> {
  render() {
    const { handleSubmit, isSubmitting, status = {}, hasPassword, intl, values } = this.props;
    const { success, formError } = status;
    return (
      <div>
        {success ? (
          <div className={styles.successRefresh} data-test-id="changePasswordSuccessText">
            <FormattedMessage {...messages.success} />
          </div>
        ) : (
          <ChangePasswordForm
            formError={formError}
            hasPassword={hasPassword}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            submitLabel={intl.formatMessage(messages.change)}
            {...values}
          />
        )}
      </div>
    );
  }
}
const handleSubmit = (data: FormValues, formikBag: FormikBag<Props, FormValues>) => {
  const { setStatus, setSubmitting, props } = formikBag;
  props.dispatch(changePassword(data.currentPassword, data.newPassword))
    .then(() => {
      setSubmitting(false);
      setStatus({ success: true, formError: '' });
    })
    .catch(({ message: formError }) => {
      setSubmitting(false);
      setStatus({ success: false, formError });
    });
};

const changePasswordWithFormik = withFormik<StateProps & InjectedProps, FormValues>({
  mapPropsToValues: () => ({
    currentPassword: '',
    newPassword: '',
    newPassword2: '',
  }),
  validateOnBlur: false,
  validateOnChange: false,
  validate: /* istanbul ignore next */ (values, props) => validatePasswords(values, {
    ...props,
    fieldKeys: ['newPassword', 'newPassword2'] as const,
  }),
  handleSubmit,
})(ChangePassword);

const mapStateToProps = ({ userSettings: { hasPassword } }: StoreState): StateProps => ({ hasPassword });

const connectedChangePassword = connect(mapStateToProps)(injectIntl(changePasswordWithFormik));

export default connectedChangePassword;
