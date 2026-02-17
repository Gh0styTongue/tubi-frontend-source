import type { IntlShape } from 'react-intl';

import { addNotification } from 'common/actions/ui';
import type { majorEventFailsafeMessageSelector } from 'common/selectors/remoteConfig';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import { getFormattedFailsafeMessage } from 'common/utils/failsafe';

export const showFeatureUnavailableToaster = ({ dispatch, intl, feature = 'feature', currentDate, majorEventFailsafeMessages }: {
  dispatch: TubiThunkDispatch;
  intl: IntlShape;
  currentDate: Date;
  majorEventFailsafeMessages: ReturnType<typeof majorEventFailsafeMessageSelector>;
  feature?: 'rating' | 'reminder' | 'myList' | 'continueWatching' | 'feature';
}) => {
  const { header, subtext, endTime } = majorEventFailsafeMessages;
  const { formattedHeader, formattedSubtext } = getFormattedFailsafeMessage({
    intl,
    currentDate,
    endTime,
    header,
    subtext,
    feature,
  });
  /* istanbul ignore next*/
  if (!formattedSubtext || !formattedHeader) return;
  dispatch(
    addNotification(
      {
        status: 'info',
        autoDismiss: false,
        title: formattedHeader,
        description: formattedSubtext,
      },
      `${feature}-unavailable-prompt`
    )
  );
};
