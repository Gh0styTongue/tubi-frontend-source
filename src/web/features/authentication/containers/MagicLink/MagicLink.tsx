import React from 'react';
import type { RouteComponentProps } from 'react-router';

import type { StatusValues } from 'common/constants/magic-link';

import OTTMagicLink from './OTTMagicLink';
import WebMagicLink from './WebMagicLink';

const MagicLink: React.FunctionComponent<RouteComponentProps<unknown, { status: StatusValues }>> = ({ routeParams, location }) => {
  const { status } = routeParams;
  const { query } = location;
  const isRequestedFromWeb = query?.platform === 'WEB';

  return isRequestedFromWeb ? <WebMagicLink status={status} /> : <OTTMagicLink status={status} />;
};

export default MagicLink;
