import type { ElementType, ReactNode } from 'react';
import React, { useCallback, useState, useRef, Fragment } from 'react';

import styles from './TruncatedText.scss';
import useIsTruncated from './useIsTruncated';

interface Props {
  children: ReactNode;
  className?: string;
  component?: ElementType;
  maxLine?: number;
  readMoreText?: string;
}

const TruncatedText = ({ component: Component = 'div', children, maxLine = 1, readMoreText }: Props) => {
  const ref = useRef(null);
  const [isShowAll, setIsShowAll] = useState(false);

  const isTruncated = useIsTruncated(ref);

  const style = isShowAll
    ? {}
    : { display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: maxLine, overflow: 'hidden' };

  const props = {
    ref,
    style,
  };

  const isShowReadMore = isTruncated && readMoreText && !isShowAll;

  const onReadMoreClick = useCallback(() => {
    setIsShowAll(true);
  }, []);

  return (
    <Fragment>
      <Component {...props}>{children}</Component>
      {isShowReadMore && (
        <button className={styles.readMore} onClick={onReadMoreClick}>
          {readMoreText}
        </button>
      )}
    </Fragment>
  );
};

export default TruncatedText;
