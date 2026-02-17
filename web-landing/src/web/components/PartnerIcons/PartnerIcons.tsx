import classNames from 'classnames';
import React from 'react';

import MGM from 'common/components/uilib/PngLibrary/MGM';
import LionsGate from 'common/components/uilib/SvgLibrary/LionsGate';
import ParamountIcon from 'common/components/uilib/SvgLibrary/ParamountIcon';
import WarnerBrosIcon from 'common/components/uilib/SvgLibrary/WarnerBrosIcon';

import styles from './PartnerIcons.scss';

const PartnerIcons: React.FunctionComponent<{ className: string }> = (props: { className: string }) => {
  const outerClass = classNames(styles.partnerIcons, props.className);
  return (
    <div className={outerClass}>
      <WarnerBrosIcon role="img" />
      <MGM white role="img" />
      <ParamountIcon role="img" />
      <LionsGate role="img" />
    </div>
  );
};

export default PartnerIcons;
