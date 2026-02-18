import type { FormikBag } from 'formik';

import { ParentalRating } from 'common/constants/ratings';
import { addKidAccount } from 'common/features/authentication/api/kidAccount';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import { preloadImages } from 'common/utils/preloadImages';

import { ContentSettingOptions, RATING_IMAGE_PREFIX } from '../constants';
import type { FormValues } from '../types';

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
      kidsPIN: pin,
    } = values;
    const parental_rating = ratingMap[contentSetting];

    await dispatch(
      addKidAccount({
        activation_code,
        name,
        parental_rating,
        pin,
      })
    );
  } finally {
    setSubmitting(false);
  }
};

export const preloadRatingImages = () => {
  const images = [YOUNGEST, YOUNGER, OLDER, OLDEST].map((rating) => `${RATING_IMAGE_PREFIX}${rating}.png`);
  preloadImages(images);
};
