import ButtonUI from '@adrise/web-ui/lib/Button/Button';
import type { ButtonProps } from '@adrise/web-ui/lib/Button/Button';
import React from 'react';
import { connect } from 'react-redux';

import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type StoreState from 'common/types/storeState';
import { KIDS_MODE_THEME_COLOR } from 'src/config';

export interface Props {
  isKidsModeEnabled: boolean;
  dispatch?: TubiThunkDispatch;
  type?: string;
  tabIndex?: number;
}

export const Button: React.FunctionComponent<Props & ButtonProps> = (props) => {
  const { dispatch, isKidsModeEnabled, ...restProps } = props;
  const { color, inverse } = restProps;
  if ((!color || color === 'primary') && !inverse && isKidsModeEnabled) {
    restProps.color = KIDS_MODE_THEME_COLOR;
  }

  return (
    <ButtonUI {...restProps} />
  );
};

const mapStateToProps = ({ ui: { isKidsModeEnabled } }: StoreState) => {
  return {
    isKidsModeEnabled,
  };
};

export default connect(mapStateToProps)(Button);
