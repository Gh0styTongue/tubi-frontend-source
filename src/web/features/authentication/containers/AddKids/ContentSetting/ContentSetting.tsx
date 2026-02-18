import { useRefMap } from '@adrise/utils/lib/useRefMap';
import { Link as LinkIcon } from '@tubitv/icons';
import { Button, ATag } from '@tubitv/web-ui';
import classNames from 'classnames';
import React, { useState, useCallback, useEffect } from 'react';
import { useIntl } from 'react-intl';
import { withRouter } from 'react-router';
import type { WithRouterProps } from 'react-router';
import type { ElementOf } from 'ts-essentials';

import { WEB_ROUTES } from 'common/constants/routes';
import tubiHistory from 'common/history';
import { trackRegisterEvent, ProgressType } from 'web/features/authentication/utils/track';

import styles from '../common.scss';
import contentSettingStyles from './ContentSetting.scss';
import { ContentSettingOptions, HELP_CENTER_ARTICLE, RATING_IMAGE_PREFIX } from '../constants';
import mainMessages, {
  contentSettingMessages as messages,
} from '../messages';
import type { FormValues } from '../types';

const { YOUNGEST, YOUNGER, OLDER, OLDEST } = ContentSettingOptions;

const options = [{
  name: YOUNGEST,
  text: messages.youngest,
  image: 'youngest.png',
  ratings: ['TV-Y'],
}, {
  name: YOUNGER,
  text: messages.younger,
  image: 'younger.png',
  ratings: ['TV-G', 'G'],
}, {
  name: OLDER,
  text: messages.older,
  image: 'older.png',
  ratings: ['TV-Y7', 'TV-Y7-FV'],
}, {
  name: OLDEST,
  text: messages.oldest,
  image: 'oldest.png',
  ratings: ['TV-PG', 'PG'],
}] as const;

type Option = ElementOf<typeof options>['name'];

export const ContentSetting = ({ location }: WithRouterProps) => {
  const { formatMessage } = useIntl();

  const form = location.state?.form as FormValues;

  const initialOption = form?.contentSetting;
  const [selectedOption, setSelectedOption] = useState<Option>(initialOption);
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedOption(e.target.value as Option);
    e.target.parentElement?.scrollIntoView({ inline: 'center', block: 'end', behavior: 'smooth' });
  }, []);

  const [getRef, refMap] = useRefMap<HTMLInputElement | null>(null);
  useEffect(() => {
    if (initialOption) {
      // https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView#behavior
      const selectedInput = refMap.current.get(initialOption)?.current;
      selectedInput?.focus();
      selectedInput?.parentElement?.scrollIntoView({ inline: 'center', block: 'end', behavior: 'instant' as ScrollBehavior });
    }
  }, [refMap, initialOption]);

  const handleClickButton = useCallback(() => {
    // update form value into router state
    const newFormState = {
      ...form,
      contentSetting: selectedOption,
    };
    tubiHistory.replace({
      pathname: location.pathname,
      state: {
        form: newFormState,
      },
    });
    // go back to previous route, and replace the route with the latest form state.
    // the async operation ensures that the history state is replaced as desired.
    tubiHistory.goBack();
    setTimeout(() => {
      tubiHistory.replace({
        pathname: WEB_ROUTES.addKidsSetup,
        state: {
          form: newFormState,
        },
      });
      trackRegisterEvent({ progress: ProgressType.COMPLETED_CONTENT_SETTING });
    }, 50);
  }, [form, selectedOption, location.pathname]);

  const handlePreventDefault = useCallback(/* istanbul ignore next */(e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <form className={styles.main} onSubmit={handlePreventDefault}>
      <div className={contentSettingStyles.fieldset}>
        <h1>{formatMessage(messages.conetentSettingTitle)}</h1>
        <p>
          <ATag to={HELP_CENTER_ARTICLE} target="_blank">
            {formatMessage(messages.contentSettingDesc)}
            <LinkIcon />
          </ATag>
        </p>
        <ul className={contentSettingStyles.options}>
          {options.map(({ name, text, image, ratings }) => (
            <li key={name}>
              <input
                type="radio"
                name="contentSetting"
                id={name}
                value={name}
                checked={name === selectedOption}
                onChange={handleChange}
                ref={getRef(name)}
              />
              <label htmlFor={name}>
                <span>{formatMessage(messages.optionPrefix)}</span>
                <strong>{formatMessage(text)}</strong>
                <img src={`${RATING_IMAGE_PREFIX}${image}`} />
                <span>{formatMessage(messages.optionHint)}</span>
                <div>
                  {ratings.map((rating) => <span key={rating}>{rating}</span>)}
                </div>
              </label>
            </li>
          ))}
        </ul>
        <ul className={contentSettingStyles.markers}>
          {options.map(({ name }, index) => (
            <li className={classNames({
              [contentSettingStyles.active]: name === selectedOption || (!selectedOption && index === 0),
            })}
            />
          ))}
        </ul>
      </div>
      <div className={styles.button}>
        <Button
          appearance={selectedOption ? 'primary' : 'tertiary'}
          width="theme"
          onClick={handleClickButton}
        >{formatMessage(mainMessages.continue)}</Button>
      </div>
    </form>
  );
};

export default withRouter(ContentSetting);
