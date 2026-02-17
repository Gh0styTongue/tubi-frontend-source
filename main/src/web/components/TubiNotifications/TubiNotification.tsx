import { ThumbDownFilled, ThumbUpFilled, MyListFilled, MyListOutline, Trash } from '@tubitv/icons';
import classNames from 'classnames';
import React, { PureComponent } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import AlertWarningInfo from 'common/components/uilib/SvgLibrary/AlertWarningInfo';
import SuccessChecked from 'common/components/uilib/SvgLibrary/SuccessChecked';
import { NOTIFICATION_DISMISS_TIMEOUT } from 'common/constants/constants';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type { Notification as NotificationType } from 'common/types/ui';

import styles from './TubiNotifications.scss';

const messages = defineMessages({
  defaultButton: {
    description: 'Button text to close notification popup',
    defaultMessage: 'Close',
  },
});

export interface TubiNotificationProps extends NotificationType {
  id?: string;
  dispatch: TubiThunkDispatch;
  autoDismissDuration?: number;
  wrapTitle?: boolean;
  nodeRef?: React.RefObject<HTMLDivElement>;
}

export default class TubiNotification extends PureComponent<TubiNotificationProps> {
  static defaultProps = {
    autoDismiss: true,
    autoDismissDuration: NOTIFICATION_DISMISS_TIMEOUT,
    buttons: [{
      primary: true,
    }],
    wrapTitle: false,
  };

  private statusSection: JSX.Element | null;

  constructor(props: TubiNotificationProps) {
    super(props);
    this.statusSection = this.getStatusSection();
  }

  componentDidMount() {
    if (this.props.autoDismiss) this.selfDestruct();
  }

  getStatusSection = () => {
    const { status } = this.props;
    if (!status) return null;
    const icons = {
      info: AlertWarningInfo,
      warning: AlertWarningInfo,
      alert: AlertWarningInfo,
      success: SuccessChecked,
      like: ThumbUpFilled,
      dislike: ThumbDownFilled,
      add: MyListFilled,
      remove: MyListOutline,
      delete: Trash,
    };
    const StatusIcon = icons[status];
    const iconCls = classNames(styles.status, styles[status]);
    return (
      <div className={iconCls}>
        <StatusIcon />
      </div>
    );
  };

  selfDestruct = () => {
    const { autoDismissDuration, close } = this.props;
    return setTimeout(() => {
      close?.();
    }, autoDismissDuration);
  };

  handleClick = (idx: number, event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const { buttons, close, dispatch } = this.props;
    const buttonClicked = buttons![idx];
    if (buttonClicked !== undefined) {
      const { action, needsDispatch } = buttonClicked;
      if (!action) return close?.();

      if (needsDispatch) {
        dispatch(action(event));
      } else {
        action(event);
      }
      close?.();
    }
  };

  render() {
    const { status = '', title, description, buttons, wrapTitle } = this.props;
    const notificationCls = classNames(styles.notification, styles[status], {
      [styles.hasStatus]: status,
    });

    return (
      <div className={notificationCls} ref={this.props.nodeRef}>
        {this.statusSection}
        <div className={styles.main}>
          <div className={classNames(styles.title, { [styles.wrap]: wrapTitle })}>
            {title as string}
          </div>
          <div className={styles.description}>
            {description as string}
          </div>
        </div>
        <div className={styles.buttons}>
          {buttons && buttons.map((button, idx) => {
            if (idx >= 2) return null; // no more than two buttons
            const buttonClass = classNames(styles.button, {
              // apply primary styling if is primary button or it is the only button
              [styles.primaryButton]: button.primary,
            });
            return <div key={idx} className={buttonClass} onClick={e => this.handleClick(idx, e)}>{button.title as string || <FormattedMessage {...messages.defaultButton} />}</div>;
          })}
        </div>
      </div>
    );
  }
}
