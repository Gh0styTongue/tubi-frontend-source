import { Manipulation, Messages, ActionStatus } from '@tubitv/analytics/lib/authEvent';
import type { FormikBag } from 'formik';

import { ParentalRating } from 'common/constants/ratings';
import { appendKidAccount } from 'common/features/authentication/actions/kidAccount';
import { addKidAccount } from 'common/features/authentication/api/kidAccount';
import { clearPendingAdmin, getPendingAdmin } from 'common/features/authentication/store/pendingAdminStore';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import { trackAccountEvent } from 'common/utils/analytics';
import { preloadImages } from 'common/utils/preloadImages';
import { getClientUser } from 'common/utils/server';
import { trackRegisterEvent, ProgressType } from 'web/features/authentication/utils/track';

import { ContentSettingOptions, RATING_IMAGE_PREFIX } from './constants';
import type { FormValues } from './types';

type Props = {
  dispatch: TubiThunkDispatch;
};

const { YOUNGEST, YOUNGER, OLDER, OLDEST } = ContentSettingOptions;
const { YOUNGEST_KIDS, YOUNGER_KIDS, OLDER_KIDS, OLDEST_KIDS } = ParentalRating;

const ratingMap = {
  [YOUNGEST]: YOUNGEST_KIDS,
  [YOUNGER]: YOUNGER_KIDS,
  [OLDER]: OLDER_KIDS,
  [OLDEST]: OLDEST_KIDS,
};

export const submitSetupForm = async (
  values: FormValues,
  formikBag: FormikBag<Props, Pick<FormValues, 'activationCode'>>
) => {
  // prevent form from re-submitting after browser refresh
  /* istanbul ignore else */
  if (typeof window !== 'undefined') {
    window.history.replaceState(null, '', window.location.href);
  }
  const {
    props: { dispatch },
    setSubmitting,
  } = formikBag;

  try {
    setSubmitting(true);

    const {
      activationCode: activation_code,
      kidsFirstName: name,
      contentSetting,
      pinEnabled,
      kidsPIN: pin,
    } = values;
    const parental_rating_v2 = ratingMap[contentSetting];

    trackRegisterEvent({ progress: ProgressType.CLICKED_REGISTER });

    // Use pending admin's token if available (when user selected an admin from AddAccount flow)
    // This ensures the API call uses the correct admin's authorization
    const pendingAdmin = getPendingAdmin();
    const fetchOptions = pendingAdmin?.token ? {
      headers: {
        Authorization: `Bearer ${pendingAdmin.token}`,
      },
    } : undefined;

    const kid = await dispatch(
      addKidAccount({
        activation_code,
        name,
        parental_rating_v2,
        ...pinEnabled ? { pin } : {},
      }, fetchOptions)
    );
    trackAccountEvent({
      current: 'EMAIL',
      manip: Manipulation.SIGNUP_KID,
      message: Messages.SUCCESS,
      status: ActionStatus.SUCCESS,
    });
    trackAccountEvent({
      manip: Manipulation.REGISTER_DEVICE,
      status: ActionStatus.SUCCESS,
    });
    // after adding kid account, we need to update the parent's kids in userSettings and redux.auth.userList
    const newKid = getClientUser(kid);
    dispatch(appendKidAccount(newKid));

    // Clear pending admin after successful kid account creation
    clearPendingAdmin();

    return newKid;
  } catch (error) {
    trackAccountEvent({
      current: 'EMAIL',
      manip: Manipulation.SIGNUP_KID,
      message: Messages.AUTH_FAIL,
      status: ActionStatus.FAIL,
    });
    trackAccountEvent({
      manip: Manipulation.REGISTER_DEVICE,
      status: ActionStatus.FAIL,
    });
    return Promise.reject(error);
  } finally {
    setSubmitting(false);
  }
};

export const preloadRatingImages = () => {
  const images = [YOUNGEST, YOUNGER, OLDER, OLDEST].map((rating) => `${RATING_IMAGE_PREFIX}${rating}.png`);
  preloadImages(images);
};
