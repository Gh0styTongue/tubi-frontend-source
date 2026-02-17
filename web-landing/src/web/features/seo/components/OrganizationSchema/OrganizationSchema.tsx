import React from 'react';
import type { IntlShape } from 'react-intl';
import { useIntl } from 'react-intl';
import type { WithContext, Organization } from 'schema-dts';

import { tubiLogoURL } from 'common/constants/constants';
import { EXTERNAL_LINKS } from 'common/constants/routes';

import messages from './messages';
import JsonLdScript from '../JsonLdScript/JsonLdScript';

// https://developers.google.com/search/docs/appearance/structured-data/logo
export const genJsonLd = ({ formatMessage }: IntlShape): WithContext<Organization> => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': 'Tubi',
    'url': 'https://tubitv.com',
    'logo': tubiLogoURL,
    'description': formatMessage(messages.description),
    'sameAs': [
      EXTERNAL_LINKS.facebookPage,
      EXTERNAL_LINKS.twitterPage,
      EXTERNAL_LINKS.instagramPage,
      EXTERNAL_LINKS.linkedInPage,
      EXTERNAL_LINKS.youtubePage,
      EXTERNAL_LINKS.tiktokPage,
    ],
  };
};

const OrganizationSchema = () => {
  const intl = useIntl();
  const jsonLd = genJsonLd(intl);

  return <JsonLdScript jsonLd={jsonLd} />;
};

export default OrganizationSchema;
