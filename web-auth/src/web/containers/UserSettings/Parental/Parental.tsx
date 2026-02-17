import { Dropdown, ErrorMessage, TextInput } from '@tubitv/web-ui';
import type { DropdownOption } from '@tubitv/web-ui';
import React, { PureComponent } from 'react';
import { injectIntl } from 'react-intl';
import type { IntlShape } from 'react-intl';
import { connect } from 'react-redux';
import type { RouteComponentProps, InjectedRouter } from 'react-router';

import { addNotification } from 'common/actions/ui';
import { updateParental } from 'common/actions/userSettings';
import DynamicButton from 'common/components/uilib/DynamicButton/DynamicButton';
import { parentalRatingsSelector } from 'common/selectors/ui';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type { StoreState } from 'common/types/storeState';
import type { Notification } from 'common/types/ui';
import { findIndex } from 'common/utils/collection';
import type { ParentalRatingsDropdownValue } from 'common/utils/ratings';
import NoPassword from 'web/components/NoPassword/NoPassword';

import styles from './Parental.scss';
import messages from './parentalMessages';
import sharedStyles from '../UserSettings.scss';

interface ParentalState {
  parentalRating: number;
  password: string;
  updateParentalError: string;
  unsaved: boolean;
}

interface StateProps {
  parentalRating: number;
  ratingsList: ParentalRatingsDropdownValue[];
  isMobile: boolean;
  hasPassword: boolean;
}

export interface ParentalProps extends StateProps, RouteComponentProps<Record<string, never>, Record<string, never>> {
  intl: IntlShape;
  dispatch: TubiThunkDispatch;
}

export class Parental extends PureComponent<ParentalProps, ParentalState> {
  context!: React.ContextType<React.Context<{ router: InjectedRouter }>>;

  constructor(props: ParentalProps) {
    super(props);
    this.state = {
      parentalRating: props.parentalRating,
      password: '',
      updateParentalError: '',
      unsaved: false,
    };
  }

  componentDidMount() {
    if (!this.props.isMobile) {
      this.context.router?.setRouteLeaveHook(this.props.route, this.routerWillLeave);
    }
  }

  routerWillLeave = () => {
    // todo(Tim) replace this with a local modal pop up
    if (this.state.unsaved) {
      return this.props.intl.formatMessage(messages.warning);
    }
  };

  setRating = (index: number) => {
    this.setState({
      parentalRating: index,
      unsaved: true,
    });
  };

  onSelectChange = (e: { target: { value: string } }) => {
    const index = findIndex(this.props.ratingsList, rating => rating.value === e.target.value);
    this.setRating(index);
  };

  showNotification = (rating: number) => {
    const { intl, ratingsList } = this.props;
    // if user came from deep linked content page above allowed level.
    const { ref } = this.props.location.query;

    const ratingLabel = ratingsList[rating];
    const ratingText = intl.formatMessage(ratingLabel.label);

    const notification: Notification = {
      status: 'success',
      title: intl.formatMessage(messages.notificationTitle),
      description: intl.formatMessage(messages.notificationDesc, { rating: ratingText }),
      autoDismiss: false,
      buttons: [
        {
          title: ref ? intl.formatMessage(messages.notificationButtonWatch) : intl.formatMessage(messages.notificationButton),
          primary: true,
          action: ref ? () => { this.context.router?.push(ref); } : undefined,
        },
      ],
    };
    this.props.dispatch(addNotification(notification, 'parental-update'));
  };

  handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      password: e.target.value,
    });
  };

  handleSave = () => {
    const { parentalRating, password, unsaved } = this.state;
    const { dispatch, location } = this.props;

    this.setState({ updateParentalError: '' });

    if (!unsaved) return Promise.reject();

    return dispatch(updateParental(location, parentalRating, password))
      .then(() => {
        this.showNotification(parentalRating);
        this.setState({ unsaved: false, password: '', updateParentalError: '' });
      })
      .catch((error) => {
        this.setState({ updateParentalError: error });
        return Promise.reject();
      });
  };

  getRatingsDropDownValuesLocalized = () => {
    return this.props.ratingsList.map(({ value, label }) => {
      return {
        value,
        label: this.props.intl.formatMessage(label),
      };
    });
  };

  render() {
    const { hasPassword, intl: { formatMessage } } = this.props;
    const { parentalRating, password, unsaved, updateParentalError } = this.state;

    const dropdownOptions = this.getRatingsDropDownValuesLocalized();
    const activeDropdownOption = dropdownOptions[parentalRating];
    const handleSelectChange = ({ value }: DropdownOption) => this.onSelectChange({ target: { value } });

    return (
      <div className={sharedStyles.main} data-test-id="parental-refresh">
        <h1 className={sharedStyles.header}>{formatMessage(messages.title)}</h1>
        {hasPassword ? (
          <React.Fragment>
            <p className={sharedStyles.subheader}>
              {formatMessage(messages.choose)}
            </p>
            <form className={styles.formContainer}>
              {updateParentalError && <ErrorMessage className={styles.error} message={updateParentalError} />}
              <Dropdown
                defaultOption={activeDropdownOption}
                name="parental"
                label={formatMessage(messages.dropdownLabel)}
                options={dropdownOptions}
                onSelect={handleSelectChange}
              />
              <p className={styles.passwordDescription}>{formatMessage(messages.enterPw)}</p>
              <TextInput
                canShowPassword
                name="password"
                label={formatMessage(messages.password)}
                onChange={this.handlePasswordChange}
                type="password"
                value={password}
              />
              <DynamicButton
                className={styles.submitButton}
                defaultLabel={formatMessage(messages.save)}
                promise={this.handleSave}
                submittingLabel={formatMessage(messages.saving)}
                successLabel={formatMessage(messages.saved)}
                type="submit"
                unsaved={unsaved}
                useRefreshStyle
              />
            </form>
          </React.Fragment>
        ) : (
          <NoPassword
            textClassName={sharedStyles.subheader}
            useRefreshStyle
          />
        )}
      </div>
    );
  }
}

const mapStateToProps = (state: StoreState) => {
  const { userSettings: { parentalRating, hasPassword }, ui: { isMobile } } = state;
  // temporary. We have some users with rating 4 still, so we need to replace or render throws error
  const rating = parentalRating === 4 ? 3 : parentalRating;
  return {
    parentalRating: rating,
    ratingsList: parentalRatingsSelector(state),
    isMobile,
    hasPassword,
  };
};

export default connect(mapStateToProps)(injectIntl(Parental));
