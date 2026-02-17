import classNames from 'classnames';
import type { ChangeEventHandler, FC } from 'react';
import React from 'react';
import { defineMessages, useIntl, FormattedMessage } from 'react-intl';

import TubiCheckbox from 'common/components/uilib/TubiCheckbox/TubiCheckbox';

import styles from './AccountDeletion.scss';

export const messages = defineMessages({
  ads: {
    description: 'reason for deleting account',
    defaultMessage: 'There\'s too many ads',
  },
  content: {
    description: 'reason for deleting account',
    defaultMessage: 'I don\'t like the content',
  },
  issues: {
    description: 'reason for deleting account',
    defaultMessage: 'I\'ve experienced technical issues',
  },
  other: {
    description: 'reason for deleting account',
    defaultMessage: 'Other (please specify)',
  },
  title: {
    description: 'delete account modal title',
    defaultMessage: 'We are sorry to see you go!',
  },
  improve: {
    description: 'delete account modal question',
    defaultMessage: 'Let us know how we can improve',
  },
});

const checkboxData = [
  {
    key: 'ads',
    text: messages.ads,
  },
  {
    key: 'content',
    text: messages.content,
  },
  {
    key: 'technical',
    text: messages.issues,
  },
  {
    key: 'other',
    text: messages.other,
  },
];

export type ReasonsChecked = {
  ads: boolean;
  content: boolean;
  technical: boolean;
  other: boolean;
};

const ReasonsModal: FC<{
  checkboxes: ReasonsChecked,
  otherReason: string,
  onTextChange: (text: string) => void,
  onCheckboxClick: (key: string) => void,
}> = ({ checkboxes, otherReason, onTextChange, onCheckboxClick }) => {
  const intl = useIntl();
  const handleTextChange: ChangeEventHandler<HTMLTextAreaElement> = (e) => {
    onTextChange(e.target.value);
  };

  const inputDisabled = !checkboxes.other;

  const textareaCls = classNames(styles.otherReason, { [styles.disabled]: inputDisabled });

  return (
    <div className={styles.firstModal}>
      <h1 className={styles.title}><FormattedMessage {...messages.title} /></h1>
      <div className={styles.text}>
        <FormattedMessage {...messages.improve} />
      </div>
      <div className={styles.leaveReasons}>
        {
          checkboxData.map(checkbox =>
            (<TubiCheckbox
              key={checkbox.key}
              value={intl.formatMessage(checkbox.text)}
              checked={checkboxes[checkbox.key]}
              checkboxKey={checkbox.key}
              handleChange={onCheckboxClick}
            />)
          )
        }
      </div>
      {!inputDisabled ? (
        <textarea
          disabled={inputDisabled}
          className={textareaCls}
          value={otherReason}
          onChange={handleTextChange}
        />
      ) : null}
    </div>
  );
};

export default ReasonsModal;
