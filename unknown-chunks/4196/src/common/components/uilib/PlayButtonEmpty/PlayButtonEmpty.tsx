import classNames from 'classnames';
import React from 'react';

import styles from './PlayButtonEmpty.scss';
import SvgIcon from '../SvgIcon/SvgIcon';

type Props = {
  className?: string;
  onClick?: () => void;
  targetBlank?: boolean;
  to?: string;
};

const PlayButtonEmpty: React.FunctionComponent<Props> = (props) => {
  const { className, ...propsExceptClassName } = props;
  const playClasses = classNames(styles.play, className);
  return (
    <SvgIcon
      className={playClasses}
      viewBox="0 0 62 62"
      {...propsExceptClassName}
      data-test-id="playbuttonempty"
      role="img"
    >
      {/* eslint-disable-next-line react/jsx-no-literals -- no i18n needed for SVGs */}
      <title>Play Button Empty</title>
      <circle r="30" stroke="currentColor" fill="none" strokeWidth="2" cx="31" cy="31" />
      <path
        fill="currentColor"
        d="M28.42,37.6c-2,1-3.42,0-3.42-2.35v-8.5c0-2.34,1.38-3.39,3.42-2.35l9,4.7c2,1,2.11,2.76.07,3.8Z"
      />
    </SvgIcon>
  );
};

export default PlayButtonEmpty;
