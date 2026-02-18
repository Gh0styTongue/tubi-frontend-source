import {
  toggleEnterPINModal,
  toggleEnterPasswordModal,
  toggleAgeGateModal,
} from 'common/actions/ui';
import type {
  GateHandlers,
  PINGateConfig,
  PasswordGateConfig,
  AgeGateConfig,
} from 'common/features/authentication/types/gateHandler';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';

export const gateHandlers: GateHandlers = {
  showPINGate: (dispatch: TubiThunkDispatch, config: PINGateConfig) => {
    dispatch(toggleEnterPINModal({
      isVisible: true,
      onSuccess: config.callback,
    }));
  },

  showPasswordGate: (dispatch: TubiThunkDispatch, config: PasswordGateConfig) => {
    if (config.variant === 'startWatching') {
      dispatch(toggleEnterPasswordModal({
        isVisible: true,
        variant: 'startWatching',
        targetUser: config.targetUser!,
        onSuccess: config.callback,
      }));
    } else {
      dispatch(toggleEnterPasswordModal({
        isVisible: true,
        variant: 'exitKids',
        onSuccess: config.callback,
      }));
    }
  },

  showAgeGate: (dispatch: TubiThunkDispatch, config: AgeGateConfig) => {
    dispatch(toggleAgeGateModal({
      isVisible: true,
      isFromExitKidsMode: true,
      onUserCompliant: config.onUserCompliant,
    }));
  },
};
