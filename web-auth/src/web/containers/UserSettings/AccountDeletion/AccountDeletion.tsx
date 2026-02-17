import { createGetChildRef, createRefMapRef } from '@adrise/utils/lib/useRefMap';
import { Close } from '@tubitv/icons';
import { Button } from '@tubitv/web-ui';
import classNames from 'classnames';
import React, { PureComponent } from 'react';
import type { IntlShape } from 'react-intl';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import type { WithRouterProps } from 'react-router';
import { Link, withRouter } from 'react-router';
import { TransitionGroup, CSSTransition } from 'react-transition-group';

import type { DeleteAccountParam } from 'common/actions/userSettings';
import { deleteAccount } from 'common/actions/userSettings';
import { WEB_ROUTES } from 'common/constants/routes';
import { logout } from 'common/features/authentication/actions/auth';
import tubiHistory from 'common/history';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type { UserSettingsState } from 'common/types/userSettings';
import Modal from 'web/components/Modal/Modal';
import profileStyles from 'web/containers/UserSettings/Profile/Profile.scss';

import styles from './AccountDeletion.scss';
import ConfirmModal from './ConfirmModal';
import type { ReasonsChecked } from './ReasonsModal';
import ReasonsModal from './ReasonsModal';
import sharedStyles from '../UserSettings.scss';

export const messages = defineMessages({
  empty: {
    description: 'password field cannot be empty error',
    defaultMessage: 'Field cannot be empty!',
  },
  skip: {
    description: 'button text to skip question',
    defaultMessage: 'Skip',
  },
  cancel: {
    description: 'button text to cancel delete account',
    defaultMessage: 'Cancel',
  },
  submit: {
    description: 'button tet to submit question on why you are deleting your account',
    defaultMessage: 'Submit',
  },
  delete: {
    description: 'button text to delete account',
    defaultMessage: 'Delete',
  },
  deleteTitle: {
    description: 'Delete my account section heading',
    defaultMessage: 'DELETE MY ACCOUNT',
  },
  deleteTitle2: {
    description: 'Delete my account section heading (standard case)',
    defaultMessage: 'Delete My Account',
  },
  deleteInfo: {
    description: 'delete your account information',
    defaultMessage: 'Deleting your account from Tubi will remove your list and history and unlink the devices associated with it.',
  },
  deleteProcess: {
    description: 'time it takes to remove account',
    defaultMessage: 'Please allow up to 48 hours before your request is processed.',
  },
  deleteSSO: {
    description: 'SSO user message when trying to delete account',
    defaultMessage: 'Only available for users with Tubi Password <link>Create One</link>',
  },
  deleteButton: {
    description: 'delete account button text',
    defaultMessage: 'Delete Account',
  },
});

interface AccountDeletionOwnProps {
  updateDimmer: (key: number) => void;
  deleteError: UserSettingsState['deleteError'];
  deleteSuccess: UserSettingsState['deleteSuccess'];
  dispatch: TubiThunkDispatch;
  hasPassword: boolean;
}

interface AccountDeletionStateProps {
  intl: IntlShape
}

type AccountDeletionProps = AccountDeletionOwnProps & AccountDeletionStateProps & WithRouterProps;

interface AccountDeletionState {
  activeModal: null | 'reasons' | 'confirm';
  modalKey: number;
  delActive: boolean;
  reasonsChecked: ReasonsChecked;
  otherReason: string;
  confirmPassField: string;
  validateError: UserSettingsState['deleteError'];
}

class AccountDeletion extends PureComponent<AccountDeletionProps, AccountDeletionState> {
  private modalTransitionClasses: CSSTransition.CSSTransitionClassNames;

  private modalNodeRefMapRef = createRefMapRef<HTMLDivElement | null>();

  private getModalNodeRef = createGetChildRef<HTMLDivElement | null>(this.modalNodeRefMapRef, null);

  constructor(props: AccountDeletionProps) {
    super(props);
    this.modalTransitionClasses = {
      enter: styles.modalEnter,
      enterActive: styles.modalEnterActive,
      exit: styles.modalLeave,
      exitActive: styles.modalLeaveActive,
    };

    this.state = {
      activeModal: null,
      modalKey: 0,
      delActive: false,
      reasonsChecked: {
        ads: false,
        content: false,
        technical: false,
        other: false,
      },
      otherReason: '',
      confirmPassField: '',
      validateError: null,
    };
  }

  componentDidUpdate() {
    const { deleteSuccess, dispatch, location } = this.props;
    if (deleteSuccess) {
      dispatch(logout(location, { isByUser: true, logoutOnProxyServerOnly: true, redirectPathAfterLogout: WEB_ROUTES.home }));
    }
  }

  handlePassChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      confirmPassField: e.target.value,
    });
  };

  validate = () => new Promise<void>((resolve, reject) => {
    const { confirmPassField, validateError } = this.state;
    if (!confirmPassField) {
      this.setState(() => ({ validateError: this.props.intl.formatMessage(messages.empty) }));
      reject('empty field');
    } else {
      if (validateError) {
        this.setState(() => ({ validateError: null }));
      }
      resolve();
    }
  });

  handleClickDel = () => {
    this.setState({
      delActive: !this.state.delActive,
    });
  };

  handleHideModal = () => {
    this.props.updateDimmer(0);
    this.setState({
      modalKey: 0,
    });
  };

  handleCheckboxClick = (value: string) => {
    const { reasonsChecked } = this.state;
    this.setState({
      reasonsChecked: {
        ...reasonsChecked,
        [value]: !reasonsChecked[value],
      },
    });
  };

  handleTextChange = (value: string) => {
    this.setState({
      otherReason: value,
    });
  };

  setModalState = (nextModalKey: number, nextActiveModal: AccountDeletionState['activeModal']) => {
    this.props.updateDimmer(nextModalKey);
    this.setState({
      activeModal: nextActiveModal,
      modalKey: nextModalKey,
    });
  };

  handleSetNewPassword = () => {
    tubiHistory.push(WEB_ROUTES.newPassword);
  };

  updateModal = (e: React.MouseEvent, submit = false) => {
    e.stopPropagation();
    const { modalKey } = this.state;
    // start modal flow
    if (modalKey === 0 || modalKey === 1) {
      let nextActiveModal: AccountDeletionState['activeModal'];
      let nextModalKey;
      if (modalKey === 0) {
        // place first modal
        nextActiveModal = 'reasons';
        nextModalKey = 1;
      } else {
        // place second
        nextActiveModal = 'confirm';
        nextModalKey = 2;
      }
      this.setModalState(nextModalKey, nextActiveModal);
    } else {
      // handle submitting modal
      if (submit) {
        this.validate().then(() => {
          const { confirmPassField: password, reasonsChecked, otherReason: other } = this.state;
          const reasons = Object.keys(reasonsChecked).filter(key => reasonsChecked[key]);
          const disableObj: DeleteAccountParam = { type: 'email', token: password, reasons };

          if (other) disableObj.other = other;
          this.props.dispatch(deleteAccount(disableObj));
        }).catch(err => err);
      } else {
        this.setModalState(0, null);
      }
    }
  };

  render() {
    const { activeModal, modalKey, reasonsChecked, otherReason, validateError, confirmPassField } = this.state;
    const { hasPassword, intl } = this.props;
    const leftBtnLabel = modalKey === 1 ? intl.formatMessage(messages.skip) : intl.formatMessage(messages.cancel);
    const rtBtnLabel = modalKey === 1 ? intl.formatMessage(messages.submit) : intl.formatMessage(messages.delete);

    let modalWrapper;
    let modal;
    if (modalKey) {
      const activeModalComponent = activeModal === 'reasons'
        ? (<ReasonsModal
          onTextChange={this.handleTextChange}
          onCheckboxClick={this.handleCheckboxClick}
          checkboxes={reasonsChecked}
          otherReason={otherReason}
        />)
        : (<ConfirmModal
          handlePassChange={this.handlePassChange}
          passValue={confirmPassField}
          confirmError={(validateError || this.props.deleteError) ?? undefined}
        />);

      modalWrapper = (
        <Modal className={styles.deleteModal} key={modalKey} ref={this.getModalNodeRef(modalKey)}>
          <Close onClick={this.handleHideModal} className={styles.closeX} />
          {activeModalComponent}
          <div className={styles.modalBtns}>
            <Button
              appearance="tertiary"
              onClick={this.updateModal}
            >{leftBtnLabel}</Button>
            <Button
              appearance="primary"
              onClick={e => this.updateModal(e, modalKey === 2)}
            >{rtBtnLabel}</Button>
          </div>
        </Modal>
      );

      modal = (
        <TransitionGroup component="div">
          <CSSTransition
            key={modalKey}
            classNames={this.modalTransitionClasses}
            timeout={400}
            nodeRef={this.getModalNodeRef(modalKey)}
          >
            {modalWrapper}
          </CSSTransition>
        </TransitionGroup>
      );
    }

    const mainClass = classNames(styles.accountDelMain, sharedStyles.main, profileStyles.main);
    return (
      <div className={mainClass}>
        {modal}
        <h2 className={sharedStyles.header}><FormattedMessage {...messages.deleteTitle2} /></h2>
        <p className={sharedStyles.subheader}><FormattedMessage {...messages.deleteInfo} /></p>
        <p className={styles.disclaimerText}><FormattedMessage {...messages.deleteProcess} /></p>
        {hasPassword ? (
          <Button
            appearance="primary"
            className={styles.deleteButton}
            onClick={this.updateModal}
            type="button"
          >
            <FormattedMessage {...messages.deleteButton} />
          </Button>
        ) : (
          <div className={styles.unavailableText}>
            <FormattedMessage
              {...messages.deleteSSO}
              values={{
                link: ([msg]) => <Link className={styles.link} to={WEB_ROUTES.newPassword}>{msg}</Link>,
              }}
            />
          </div>
        )}
      </div>
    );
  }
}

export default withRouter(injectIntl(AccountDeletion));
