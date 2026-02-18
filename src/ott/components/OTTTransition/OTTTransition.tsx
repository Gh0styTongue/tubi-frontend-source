import pickBy from 'lodash/pickBy';
import type { FC, ReactElement, RefObject } from 'react';
import React, { useMemo } from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import type { CSSTransitionProps } from 'react-transition-group/CSSTransition';

import SlowDeviceProvider from 'common/HOCs/SlowDeviceProvider';
import type { TransitionClassesShape } from 'common/types/ottUI';

type action = 'appear' | 'enter' | 'exit';

export interface OTTTransitionProps {
  children: ReactElement | null;
  useTransition?: boolean;
  className?: string;
  transitionAppear?: boolean;
  timeout: number | Partial<Record<action, number>>;
  transitionName?: TransitionClassesShape;
  component?: any;
  transitionEnter?: boolean;
  transitionLeave?: boolean;
  onEnter?: (node: HTMLElement, isAppearing: boolean) => void;
  onEntering?: (node: HTMLElement, isAppearing: boolean) => void;
  onEntered?: (node: HTMLElement, isAppearing: boolean) => void;
  onExit?: (node: HTMLElement) => void;
  onExiting?: (node: HTMLElement) => void;
  onExited?: (node: HTMLElement) => void;
  nodeRef?: RefObject<HTMLElement>;
  in?: boolean;
  noTransitionGroup?: boolean;
}

const OTTTransition: FC<OTTTransitionProps> = ({
  useTransition,
  className,
  component: Component = 'span',
  transitionName,
  transitionEnter,
  transitionLeave,
  transitionAppear,
  timeout,
  onEnter,
  onEntering,
  onEntered,
  onExit,
  onExiting,
  onExited,
  children: child,
  nodeRef,
  in: cssTransitionIn,
  noTransitionGroup,
  ...otherProps
}) => {
  const render = useMemo(() => (isSlowDevice: boolean) => {

    const disableTransition = typeof useTransition === 'undefined'
      ? isSlowDevice
      : !useTransition;

    if (disableTransition) {
      if (!Component) {
        return child;
      }
      return (
        <Component className={className} {...otherProps}>
          {child}
        </Component>
      );
    }

    const eventProps = pickBy(
      { onEnter, onEntering, onEntered, onExit, onExiting, onExited },
      (val) => !!val
    );

    const cssTransitionProps: CSSTransitionProps = {
      classNames: transitionName,
      timeout,
      nodeRef,
      in: cssTransitionIn,
      ...eventProps,
    };

    if (noTransitionGroup) {
      return child ? (
        <CSSTransition
          enter={transitionEnter}
          exit={transitionLeave}
          appear={transitionAppear}
          {...cssTransitionProps}
        >
          {child}
        </CSSTransition>
      ) : null;
    }

    return (
      <TransitionGroup
        component={Component}
        className={className}
        enter={transitionEnter}
        exit={transitionLeave}
        appear={transitionAppear}
      >
        {
          child
            ? (
              <CSSTransition
                {...cssTransitionProps}
              >
                {child}
              </CSSTransition>
            )
            : null
        }
      </TransitionGroup>
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [child]);

  return (
    <SlowDeviceProvider
      render={render}
    />
  );
};

export default OTTTransition;
