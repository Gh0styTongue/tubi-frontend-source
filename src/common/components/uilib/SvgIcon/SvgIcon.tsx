import classNames from 'classnames';
import type { MouseEvent } from 'react';
import React, { PureComponent } from 'react';

import styles from './styles.scss';

export interface SvgIconProps {
  color?: string;
  hoverColor?: string;
  onMouseEnter?: (event: MouseEvent) => void;
  onMouseLeave?: (event: MouseEvent) => void;
  onTouchStart?: () => void;
  onClick?: (event: MouseEvent) => void;
  viewBox?: string;
  large?: boolean;
  fallback?: never;
  fallbackProps?: never;
  className?: string;
  style?: Record<string, unknown>;
  'data-component'?: string;
  role?: string;
  height?: string;
  width?: string;
  fill?: string;
  fillRule?: 'inherit' | 'nonzero' | 'evenodd';
  xmlns?: string;
}

type State = {
  hovered: boolean;
};

export declare type SvgIconType = InstanceType<typeof SvgIcon>;

/**
 * @deprecated use `@tubitv/icons` instead
 * Encapsulates an SVG icon and gives us some convenience methods to play around. A typical usage can look like this:
 *
 * ```<SvgIcon className={styles.close} large={true} role='img'>
 *     <title>Svg Icon</title>
 *     <g><path d="M19 6.41l-1.41-1.41-....."></path></g>
 *    </SvgIcon>```
 */
export default class SvgIcon extends PureComponent<React.PropsWithChildren<SvgIconProps>, State> {
  static defaultProps = {
    color: 'currentcolor',
    large: false,
    viewBox: '0 0 24 24',
  };

  constructor(props: SvgIconProps) {
    super(props);
    this.state = {
      hovered: false,
    };
  }

  handleMouseLeave = (e: MouseEvent<SVGSVGElement>) => {
    this.setState({ hovered: false });
    if (this.props.onMouseLeave) {
      this.props.onMouseLeave(e);
    }
  };

  handleMouseEnter = (e: MouseEvent<SVGSVGElement>) => {
    this.setState({ hovered: true });
    if (this.props.onMouseEnter) {
      this.props.onMouseEnter(e);
    }
  };

  handleClick = (e: MouseEvent<SVGSVGElement>) => {
    if (this.props.onClick) {
      this.props.onClick(e);
    }
  };

  render() {
    const {
      children,
      color,
      hoverColor,
      className,
      style,
      viewBox,
      large,
      'data-component': dataComponent,
      role = 'img',
      ...other
    } = this.props;
    // do the hover color change if the caller has asked us to
    const inlineStyles = {
      fill: hoverColor && this.state.hovered ? hoverColor : color,
    };
    const mergedClassName = classNames(styles.svgIcon, className, {
      [styles.large]: large,
    });

    // Prefer to use passed-in `data-component` property on dev or testing envs
    const componentName = __STAGING__ || __PRODUCTION__ ? null : dataComponent || 'SvgIcon';
    return (
      <svg
        {...other}
        className={mergedClassName}
        preserveAspectRatio="xMidYMid meet"
        style={{ ...inlineStyles, ...style }}
        onMouseEnter={this.handleMouseEnter}
        onMouseLeave={this.handleMouseLeave}
        onClick={this.handleClick}
        viewBox={viewBox}
        data-component={componentName}
        role={role}
      >
        {children}
      </svg>
    );
  }
}
