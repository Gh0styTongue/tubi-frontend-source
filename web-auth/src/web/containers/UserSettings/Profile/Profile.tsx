import classNames from 'classnames';
import React, { PureComponent } from 'react';
import type { IntlShape } from 'react-intl';
import { defineMessages, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import type { InjectedRouter, WithRouterProps } from 'react-router';
import { withRouter } from 'react-router';

import { addNotification } from 'common/actions/ui';
import { updateUserSettings } from 'common/actions/userSettings';
import { REGEX_EMAIL_VALIDATION } from 'common/constants/validate-rules';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type StoreState from 'common/types/storeState';
import type { Notification } from 'common/types/ui';
import type { UserSettingsState } from 'common/types/userSettings';
import { validateFirstName } from 'common/utils/form';

import styles from './Profile.scss';
import ProfileChangePassword from './ProfileChangePassword/ProfileChangePassword';
import type { ProfileUserInfoProps } from './ProfileUserInfo/ProfileUserInfo';
import ProfileUserInfo from './ProfileUserInfo/ProfileUserInfo';
import AccountDeletion from '../AccountDeletion/AccountDeletion';
import sharedStyles from '../UserSettings.scss';

export const messages = defineMessages({
  saveSetting: {
    description: 'message if user leaves page without saving settings changes',
    defaultMessage: 'Navigating away will discard your new settings. Are you sure you want to leave?',
  },
  notificationTitle: {
    description: 'successfully changed email toast notification title',
    defaultMessage: 'Email changed! Please verify your email address',
  },
  notificationDesc: {
    description: 'successfully changed email toast notification description ',
    defaultMessage: 'Thanks for updating your email. We sent you an email to verify your address. Use the link in the email to complete the process.',
  },
  notificationButton: {
    description: 'successfully changed email toast notification button to close',
    defaultMessage: 'Done',
  },
  invalidEmail: {
    description: 'invalid email error message',
    defaultMessage: 'Valid Email Required!',
  },
  generalError: {
    description: 'general error message',
    defaultMessage: 'Something went wrong...',
  },
  myAccount: {
    description: 'my account user settings page title',
    defaultMessage: 'My Account',
  },
  myAccountDesc: {
    description: 'my account user settings page description',
    defaultMessage: 'Manage your profile, parental controls, notifications and history settings here.',
  },
  save: {
    description: 'save changes button text',
    defaultMessage: 'Save',
  },
  saving: {
    description: 'save changes button text during settings being saved',
    defaultMessage: 'Saving...',
  },
  saved: {
    description: 'save changes button text when settings have been saved',
    defaultMessage: 'Saved!',
  },
});

export type ProfileProps = WithRouterProps & {
  firstName: string;
  email: string;
  hasPassword: boolean;
  gender?: string;
  saving?: boolean;
  deleteSuccess: boolean;
  deleteError: string | null;
  pathname?: string;
  isMobile: boolean;
  route?: Record<string, unknown>;
  intl: IntlShape;
  dispatch: TubiThunkDispatch;
};

interface ProfileState {
  firstName: string;
  email: string;
  gender?: string;
  modalKey: number;
  unsaved: boolean;
  updateErrorMessage: string | null;
  birthMonth?: string;
  birthDay?: string;
  birthYear?: string;
}

export class Profile extends PureComponent<ProfileProps, ProfileState> {
  static defaultProps = {
    hasPassword: false,
    gender: '',
    firstName: '',
    deleteError: null,
  };

  context!: React.ContextType<React.Context<{ router: InjectedRouter }>>;

  constructor(props: ProfileProps) {
    super(props);
    this.state = {
      // this state is for managing the form
      firstName: props.firstName,
      email: props.email,
      gender: props.gender,
      modalKey: 0,
      unsaved: false,
      updateErrorMessage: null,
    };
  }

  componentDidMount() {
    if (!this.props.isMobile) {
      this.context.router?.setRouteLeaveHook(this.props.route, this.routerWillLeave);
    }
  }

  routerWillLeave = () => {
    // todo replace this with a local modal pop up
    if (this.state.unsaved) {
      return this.props.intl.formatMessage(messages.saveSetting);
    }
  };

  setFieldState<K extends keyof ProfileState>(key: K, value: ProfileState[K]) {
    this.setState({
      ...this.state,
      [key]: value,
      unsaved: true,
    });
  }

  getFieldChangeHandler = (name: keyof ProfileState) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      this.setFieldState(name, e.target.value);
    };
  };

  handleNameChange = this.getFieldChangeHandler('firstName');

  handleEmailChange = this.getFieldChangeHandler('email');

  handleGenderChange = this.getFieldChangeHandler('gender');

  validateEmail = () => REGEX_EMAIL_VALIDATION.test(this.state.email);

  validateName = () => {
    const { firstName } = this.state;
    const { intl } = this.props;
    const { firstName: nameError } = validateFirstName({ firstName, intl });
    return nameError;
  };

  /**
   * check whether birthday is valid
   * @returns {boolean}
   */
  validateBirthday = () => {
    const { birthMonth = '', birthDay = '', birthYear = '' } = this.state;

    const birthMonthInt = parseInt(birthMonth, 10);
    const birthDayInt = parseInt(birthDay, 10);
    const birthYearInt = parseInt(birthYear, 10);

    const validIntegers = Number.isInteger(birthMonthInt) && Number.isInteger(birthDayInt) && Number.isInteger(birthYearInt);
    // check invalid year, month, and day
    if (
      !validIntegers
      || birthYearInt >= new Date().getFullYear()
      || birthMonthInt > 12
      || birthMonthInt < 1
      || birthDayInt > 31
      || birthDayInt < 1
    ) {
      return false;
    }

    return true;
  };

  showVerifyEmailNotification = () => {
    const { intl } = this.props;
    const notification: Notification = {
      status: 'success',
      title: intl.formatMessage(messages.notificationTitle),
      description: intl.formatMessage(messages.notificationDesc),
      autoDismiss: false,
      withShadow: true,
      buttons: [
        {
          title: intl.formatMessage(messages.notificationButton),
          primary: true,
        },
      ],
    };

    this.props.dispatch(addNotification(notification, 'email-update'));
  };

  handleSaveSettings = () => {
    const { firstName, email, gender, unsaved } = this.state;
    const { intl } = this.props;
    const changedEmail = email !== this.props.email;

    if (!unsaved) return Promise.reject();
    // validation step for email before updating user settings
    if (!this.validateEmail()) {
      this.setState({ updateErrorMessage: intl.formatMessage(messages.invalidEmail) });
      return Promise.reject();
    }
    // validation step for name before updating user settings
    const nameError = this.validateName();
    if (nameError) {
      this.setState({ updateErrorMessage: nameError });
      return Promise.reject();
    }

    // considerations for what UAPI accepts
    const userSettings: Partial<UserSettingsState> = {
      first_name: firstName,
    } as UserSettingsState;
    if (email) userSettings.email = email;

    // uapi does not accept '' for gender
    if (!gender) {
      userSettings.gender = null;
    } else {
      userSettings.gender = gender;
    }

    return this.props
      .dispatch(updateUserSettings(this.props.location, userSettings, false))
      .then(() => {
        const newState = { updateErrorMessage: '', unsaved: false };
        if (changedEmail) {
          this.showVerifyEmailNotification();
        }
        return this.setState(newState);
      })
      .catch((err: Error & { messages?: Record<string, string>[] }) => {
        const updateErrorMessage = err.message || err.messages?.[0].message || intl.formatMessage(messages.generalError);
        this.setState({ updateErrorMessage });
        return Promise.reject(err);
      });
  };

  updateDimmer = (nextModalKey: number) => {
    this.setState({
      modalKey: nextModalKey,
    });
  };

  render() {
    const { firstName, email, modalKey, updateErrorMessage, unsaved, gender } = this.state;

    const {
      dispatch,
      deleteError,
      deleteSuccess,
      hasPassword,
      intl,
    } = this.props;

    const fields = { firstName, email, gender };
    const fieldsHandler = {
      handleNameChange: this.handleNameChange,
      handleEmailChange: this.handleEmailChange,
      handleGenderChange: this.handleGenderChange,
    };

    const dimmerCls = classNames(styles.overlayDimmer, { [styles.overlayDimmerActive]: modalKey });

    const handleGenderChange: ProfileUserInfoProps['handleGenderChange'] = ({ value }) =>
      this.handleGenderChange({ target: { value } } as React.ChangeEvent<HTMLInputElement>);
    return (
      <div className={styles.userProfile}>
        <div className={styles.mainWrapper}>
          <div className={dimmerCls} />
          <div className={classNames(sharedStyles.main, styles.main)}>
            <h1 className={sharedStyles.header}>{intl.formatMessage(messages.myAccount)}</h1>
            <p className={sharedStyles.subheader}>{intl.formatMessage(messages.myAccountDesc)}</p>
            <ProfileUserInfo
              {...fields}
              {...fieldsHandler}
              handleGenderChange={handleGenderChange}
              handleSave={this.handleSaveSettings}
              unsaved={unsaved}
              updateErrorMessage={updateErrorMessage}
            />
          </div>
          <ProfileChangePassword />
          <AccountDeletion
            deleteError={deleteError}
            deleteSuccess={deleteSuccess}
            dispatch={dispatch}
            hasPassword={hasPassword}
            updateDimmer={this.updateDimmer}
          />
        </div>
      </div>
    );
  }
}

const mapStateToProps = ({ ui: { isMobile }, userSettings }: StoreState, { location = { pathname: '' } }) => {
  const { first_name: firstName, email, hasPassword, gender, deleteError, deleteSuccess } = userSettings;
  return {
    email,
    gender: gender || '', // we need use string not null
    isMobile,
    firstName,
    hasPassword,
    deleteError,
    deleteSuccess,
    pathname: location.pathname,
  };
};

export default withRouter(connect(mapStateToProps)(injectIntl(Profile)));
