/**
 * <BackgroundImage />
 *
 * renders supplied url as a background image, will not update
 */

import { toCSSUrl } from '@adrise/utils/lib/url';
import React from 'react';

import { hashImageDomain } from 'common/utils/urlConstruction';

type Props = {
  className?: string;
  gradient?: string;
  url: string
};

const BackgroundImage: React.FunctionComponent<React.PropsWithChildren<Props>> = (props) => {
  const {
    children,
    className,
    gradient,
    url,
  } = props;
  const backgroundImage = [
    gradient,
    toCSSUrl(hashImageDomain(url)),
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div
      className={className}
      style={{ backgroundImage }}
    >
      {children}
    </div>
  );
};

export default BackgroundImage;
