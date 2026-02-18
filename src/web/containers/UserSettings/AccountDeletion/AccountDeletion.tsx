import { createGetChildRef, createRefMapRef } from '@adrise/utils/lib/useRefMap';
import { Close } from '@tubitv/icons';
import type { ButtonProps } from '@tubitv/web-ui';
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
import { RESET_DELETE_ACCOUNT_STATE } from 'common/constants/action-types';
import { WEB_ROUTES } from 'common/constants/routes';
import { logout } from 'common/features/authentication/actions/auth';
import type { DeleteKidAccountPayload } from 'common/features/authentication/api/kidAccount';
import { deleteKidAccount } from 'common/features/authentication/api/kidAccount';
import type { Kid, AvatarUrl } from 'common/features/authentication/types/auth';
import tubiHistory from 'common/history';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type { UserSettingsState } from 'common/types/userSettings';
import { actionWrapper } from 'common/utils/action';
import Modal from 'web/components/Modal/Modal';
import profileStyles from 'web/containers/UserSettings/Profile/Profile.scss';

import styles from './AccountDeletion.scss';
import ConfirmModal from './ConfirmModal';
import InfoModal from './InfoModal';
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
  deleteTitleKids: {
    description: 'Delete my account section heading (for Kids Account)',
    defaultMessage: 'Delete Tubi Kids Account',
  },
  deleteInfo: {
    description: 'delete your account information',
    defaultMessage: 'Deleting your account from Tubi will remove your list and history and unlink the devices associated with it.',
  },
  deleteInfoKids: {
    description: 'delete your account information (for Kids Account)',
    defaultMessage: 'Deleting this Tubi Kids account from Tubi will remove their list and history and unlink the devices associated with it.',
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
  deleteKidAccountButton: {
    description: 'delete account button text (for Kids Account)',
    defaultMessage: 'Delete Tubi Kids Account',
  },
  deleteAllAccountsButton: {
    description: 'delete account button text (for all accounts)',
    defaultMessage: 'Delete All Accounts',
  },
  invalidPassword: {
    description: 'text for invalid password',
    defaultMessage: 'Invalid password',
  },
  generalError: {
    description: 'general error message',
    defaultMessage: 'Something went wrong...',
  },
});

interface AccountDeletionOwnProps {
  updateDimmer: (key: number) => void;
  deleteError: UserSettingsState['deleteError'];
  deleteSuccess: UserSettingsState['deleteSuccess'];
  dispatch: TubiThunkDispatch;
  firstName?: string;
  hasPassword: boolean;
  kids?: Kid[];
  kidTubiId?: string;
  onDeleteSuccess?: () => void;
  userAvatarUrl?: AvatarUrl;
}

interface AccountDeletionStateProps {
  intl: IntlShape
}

type AccountDeletionProps = AccountDeletionOwnProps & AccountDeletionStateProps & WithRouterProps;

interface AccountDeletionState {
  activeModal: null | 'info' | 'reasons' | 'confirm';
  modalKey: number;
  delActive: boolean;
  reasonsChecked: ReasonsChecked;
  otherReason: string;
  confirmPassField: string;
  validateError: UserSettingsState['deleteError'];
}

interface ModalButton extends ButtonProps {
  label: string;
}

const initialState: AccountDeletionState = {
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

    this.state = initialState;
  }

  componentDidUpdate() {
    const { deleteSuccess, dispatch, location } = this.props;
    if (deleteSuccess) {
      dispatch(
        logout(location, { isByUser: true, logoutOnProxyServerOnly: true, redirectPathAfterLogout: WEB_ROUTES.home })
      );
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
    this.setState(initialState);
    this.props.dispatch(actionWrapper(RESET_DELETE_ACCOUNT_STATE));
  };

  handleCheckboxClick = (value: string) => {
    const { reasonsChecked } = this.state;
    this.setState({
      reasonsChecked: {
        ...reasonsChecked,
        [value]: !reasonsChecked[value as keyof typeof reasonsChecked],
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

  handleDeleteKidAccount = async (opts: DeleteKidAccountPayload) => {
    const { dispatch, intl, onDeleteSuccess, updateDimmer } = this.props;
    try {
      await dispatch(deleteKidAccount(opts));
      onDeleteSuccess?.();
      // reset state, clear dimmer, and scroll to top
      this.setState(initialState);
      updateDimmer(0);
      if (typeof window !== 'undefined') {
        window.scrollTo(0, 0);
      }
    } catch (error) {
      let deleteError = intl.formatMessage(messages.generalError);
      if (error?.status === 403) {
        deleteError = intl.formatMessage(messages.invalidPassword);
      }
      this.setState({
        validateError: deleteError,
      });
    }
  };

  handleSubmit = () => {
    this.validate().then(() => {
      const { dispatch, kidTubiId } = this.props;
      const { confirmPassField: password, reasonsChecked, otherReason: other } = this.state;
      const reasons = Object.keys(reasonsChecked).filter((key) => reasonsChecked[key as keyof typeof reasonsChecked]);
      if (kidTubiId) {
        this.handleDeleteKidAccount({
          tubi_id: kidTubiId,
          password,
          reasons,
          ...(other ? { other } : {}),
        });
      } else {
        const disableObj: DeleteAccountParam = { type: 'email', token: password, reasons };
        if (other) disableObj.other = other;
        dispatch(deleteAccount(disableObj));
      }
    }).catch((err) => err);
  };

  updateModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    const { modalKey } = this.state;
    const { kids = [] } = this.props;

    if (modalKey === 0) {
      if (kids.length > 0) {
        // first show a modal to confirm deleting all accounts
        this.setModalState(1, 'info');
      } else {
        this.setModalState(2, 'reasons');
      }
    } else if (modalKey === 1) {
      this.setModalState(2, 'reasons');
    } else if (modalKey === 2) {
      this.setModalState(3, 'confirm');
    }
  };

  render() {
    const { activeModal, modalKey, reasonsChecked, otherReason, validateError, confirmPassField } = this.state;
    const { firstName, hasPassword, intl, kids = [], kidTubiId, userAvatarUrl } = this.props;

    let modalContent;
    let modal;
    let buttonWrapperClass;
    let modalButtons: ModalButton[] = [];
    if (modalKey) {
      if (activeModal === 'info') {
        modalContent = <InfoModal firstName={firstName} kids={kids} userAvatarUrl={userAvatarUrl} />;
        buttonWrapperClass = styles.vertical;
        modalButtons = [
          {
            appearance: 'tertiary',
            label: intl.formatMessage(messages.cancel),
            onClick: this.handleHideModal,
          },
          {
            appearance: 'primary',
            label: intl.formatMessage(messages.deleteAllAccountsButton),
            onClick: this.updateModal,
          },
        ];
      } else if (activeModal === 'reasons') {
        modalContent = (
          <ReasonsModal
            onTextChange={this.handleTextChange}
            onCheckboxClick={this.handleCheckboxClick}
            checkboxes={reasonsChecked}
            otherReason={otherReason}
          />
        );
        modalButtons = [
          {
            appearance: 'tertiary',
            label: intl.formatMessage(messages.skip),
            onClick: this.updateModal,
          },
          {
            appearance: 'primary',
            label: intl.formatMessage(messages.submit),
            onClick: this.updateModal,
          },
        ];
      } else if (activeModal === 'confirm') {
        modalContent = (
          <ConfirmModal
            handlePassChange={this.handlePassChange}
            passValue={confirmPassField}
            confirmError={(validateError || this.props.deleteError) ?? undefined}
          />
        );
        modalButtons = [
          {
            appearance: 'tertiary',
            label: intl.formatMessage(messages.cancel),
            onClick: this.handleHideModal,
          },
          {
            appearance: 'primary',
            label: intl.formatMessage(messages.delete),
            onClick: this.handleSubmit,
          },
        ];
      }

      modal = (
        <TransitionGroup component="div">
          <CSSTransition
            key={modalKey}
            classNames={this.modalTransitionClasses}
            timeout={400}
            nodeRef={this.getModalNodeRef(modalKey)}
          >
            <Modal className={styles.deleteModal} key={modalKey} ref={this.getModalNodeRef(modalKey)}>
              <Close onClick={this.handleHideModal} className={styles.closeX} />
              {modalContent}
              <div className={classNames(styles.modalBtns, buttonWrapperClass)}>
                {modalButtons.map(({ appearance, label, onClick }) => (
                  <Button
                    appearance={appearance}
                    key={label}
                    onClick={onClick}
                  >{label}</Button>
                ))}
              </div>
            </Modal>
          </CSSTransition>
        </TransitionGroup>
      );
    }

    const mainClass = classNames(styles.accountDelMain, sharedStyles.main, profileStyles.main);

    let titleMessage = messages.deleteTitle2;
    let infoMessage = messages.deleteInfo;
    let buttonMessage = messages.deleteButton;
    if (kidTubiId) {
      titleMessage = messages.deleteTitleKids;
      infoMessage = messages.deleteInfoKids;
      buttonMessage = messages.deleteKidAccountButton;
    }

    return (
      <div className={mainClass}>
        {modal}
        <h2 className={sharedStyles.header}><FormattedMessage {...titleMessage} /></h2>
        <p className={sharedStyles.subheader}><FormattedMessage {...infoMessage} /></p>
        <p className={styles.disclaimerText}><FormattedMessage {...messages.deleteProcess} /></p>
        {hasPassword ? (
          <Button
            appearance="primary"
            className={styles.deleteButton}
            onClick={this.updateModal}
            type="button"
          >
            <FormattedMessage {...buttonMessage} />
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
