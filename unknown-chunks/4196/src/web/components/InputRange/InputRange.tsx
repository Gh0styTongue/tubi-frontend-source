/**
 * <InputRange />
 *
 * simulate to be a range input
 */

import { clamp } from '@adrise/utils/lib/tools';
import classNames from 'classnames';
import throttle from 'lodash/throttle';
import React, { createRef, PureComponent } from 'react';

import { addEventListener, removeEventListener } from 'common/utils/dom';

import styles from './InputRange.scss';

interface InputRangeProps {
  min: number;
  max: number;
  value: number;
  onChanged?: (position: number) => void;
  onChanging?: (position: number) => void;
  className?: string;
  isLive?: boolean;
  useRefresh?: boolean;
}

type InputRangeState = {
  value: number,
  previousValue?: number,
};

export default class InputRange extends PureComponent<InputRangeProps, InputRangeState> {
  private isDraggingScrubber = false;

  private ref = createRef<HTMLDivElement>();

  private onChanging?: (position: number) => void;

  static getDerivedStateFromProps(nextProps: InputRangeProps, prevState: InputRangeState) {
    const { value } = nextProps;
    // Run the following code block only when the props value changed , excluding the case that execute setState in handleMouseMove
    if (value !== prevState.previousValue) {
      if (value !== prevState.value) return { value, previousValue: value };
      return { previousValue: value };
    }
    return null;
  }

  constructor(props: InputRangeProps) {
    super(props);
    this.state = {
      value: props.value,
    };

    if (this.props.onChanging) {
      this.onChanging = throttle(this.props.onChanging, 200);
    }
  }

  componentDidMount() {
    addEventListener(window, 'mousemove', this.handleMouseMove);
    addEventListener(window, 'mouseup', this.handleMouseUp);
  }

  componentWillUnmount() {
    removeEventListener(window, 'mousemove', this.handleMouseMove);
    removeEventListener(window, 'mouseup', this.handleMouseUp);
  }

  computeTargetPosition(y: number): number {
    const { min, max } = this.props;
    const node = this.ref.current;
    // because ref assignment happens before cdm and before cdu chance node will go back to null (its type is T | null)
    if (node) {
      const rect = node.getBoundingClientRect();
      const ratio = clamp(((rect.bottom - y) / rect.height), 0, 1);
      return Math.floor(ratio * (max - min));
    }
    return 0;
  }

  handleMouseMove = (e: MouseEvent) => {
    if (!this.isDraggingScrubber) return;
    this.setState({
      value: this.computeTargetPosition(e.clientY),
    });
    this.onChanging?.(this.computeTargetPosition(e.clientY));
  };

  handleMouseUp = (e: MouseEvent) => {
    if (!this.isDraggingScrubber) return;
    // use a timer so that reset the flag after `click` event
    window.setTimeout(() => { this.isDraggingScrubber = false; }, 0);
    this.props.onChanged?.(this.computeTargetPosition(e.clientY));
  };

  handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // prevent `click` event in parent nodes
    e.stopPropagation();
    if (!this.isDraggingScrubber) {
      this.props.onChanged?.(this.computeTargetPosition(e.clientY));
    }
  };

  handleScrubberMouseDown = () => {
    this.isDraggingScrubber = true;
  };

  render() {
    const { min, max, className, isLive } = this.props;
    const { value } = this.state;
    return (
      <div
        className={classNames(styles.inputRange, className, { [styles.live]: isLive })}
        onClick={this.handleClick}
        ref={this.ref}
      >
        <div className={styles.track}>
          <div
            className={styles.past}
            style={{ height: `${(value / (max - min)) * 100}%` }}
          />
        </div>
        <span
          className={styles.scrubber}
          onMouseDown={this.handleScrubberMouseDown}
          style={{ bottom: `${(value / (max - min)) * 100}%` }}
        />
      </div>
    );
  }
}
