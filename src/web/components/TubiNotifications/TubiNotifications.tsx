import { createGetChildRef, createRefMapRef } from '@adrise/utils/lib/useRefMap';
import classNames from 'classnames';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import type { TransitionProps } from 'react-transition-group/Transition';

import { REMOVE_NOTIFICATION } from 'common/constants/action-types';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type StoreState from 'common/types/storeState';
import type { Notification as NotificationType } from 'common/types/ui';
import { actionWrapper } from 'common/utils/action';

import Notification from './TubiNotification';
import styles from './TubiNotifications.scss';

interface NotificationProps extends TransitionProps {
  dispatch: TubiThunkDispatch;
  notifications: NotificationType[];
  isMobile: boolean;
}

class TubiNotifications extends Component<NotificationProps> {
  static transitionName = {
    enter: styles.animationEnter,
    enterActive: styles.animationEnterActive,
    exit: styles.animationLeave,
    exitActive: styles.animationleaveActive,
  };

  private nodeRefMap = createRefMapRef<HTMLDivElement | null>();

  private getNodeRef = createGetChildRef(this.nodeRefMap, null);

  /**
   * dispatching action to close a notification given an index
   * @param {any} id - Bind before passing it as a prop to Notification
   */
  closeNotification = (id: string) => {
    this.props.dispatch?.(actionWrapper(REMOVE_NOTIFICATION, { id }));
  };

  render() {
    const { notifications, isMobile, dispatch } = this.props;
    const tubiNotificationCls = classNames(styles.tubiNotifications, {
      [styles.isMobile]: isMobile,
    });

    return (
      <div className={tubiNotificationCls}>
        <TransitionGroup
          component="div"
          className={styles.flexReverseOnMobile}
        >
          {notifications.map((notification: NotificationType) => {
            const { id, close, ...rest } = notification;
            return (
              <CSSTransition
                key={id}
                classNames={TubiNotifications.transitionName}
                timeout={500}
                nodeRef={this.getNodeRef(id)}
              >
                <Notification
                  key={id}
                  dispatch={dispatch}
                  close={this.closeNotification.bind(null, id ?? '')}
                  nodeRef={this.getNodeRef(id)}
                  {...rest}
                />
              </CSSTransition>
            );
          })}
        </TransitionGroup>
      </div>
    );
  }
}

const mapStateToProps = ({ ui }: StoreState) => ({
  notifications: ui.notifications,
  isMobile: ui.isMobile,
});

export default connect(mapStateToProps)(TubiNotifications);
