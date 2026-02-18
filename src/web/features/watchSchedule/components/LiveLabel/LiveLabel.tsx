import { LiveFilled24 } from '@tubitv/icons';
import { Label } from '@tubitv/web-ui';
import type { FC } from 'react';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  live: {
    description: 'Live, as in, "Live event happening now"',
    defaultMessage: 'Live',
  },
});

const LiveLabel: FC = () => {
  const intl = useIntl();

  return (
    <Label color="red" icon={<LiveFilled24 />}>
      {intl.formatMessage(messages.live)}
    </Label>
  );
};

export default LiveLabel;
