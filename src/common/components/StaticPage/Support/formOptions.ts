import type { IntlFormatters } from 'react-intl';
import { defineMessages } from 'react-intl';

import type { TicketField } from 'common/types/support';

interface Option {
  value: string;
  label: string;
}

const messages = defineMessages({
  selectLabel: {
    description: 'select dropdown label',
    defaultMessage: 'Select One',
  },
});

const withDefaultOptions = (options: Option[], formatMessage: IntlFormatters['formatMessage']): Option[] => [{ value: '', label: formatMessage(messages.selectLabel) }].concat(options);

export const getFieldOptions = (field: TicketField | undefined, formatMessage: IntlFormatters['formatMessage'], dynamicContentMap?: Record<string, string>, hasDefault: boolean = true): Option[] => {
  const options = field?.custom_field_options?.map(({ value, name, raw_name: rawName }) => ({
    value,
    label: dynamicContentMap?.[rawName] || name,
  })) || [];
  return hasDefault ? withDefaultOptions(options, formatMessage) : options;
};
