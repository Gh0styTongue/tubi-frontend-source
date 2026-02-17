import React from 'react';
import type {
  FAQPage,
  ItemList,
  Movie,
  Organization,
  Person,
  TVEpisode,
  TVSeries,
  VideoObject,
  WebSite,
  WithContext,
} from 'schema-dts';

import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import useAppSelector from 'common/hooks/useAppSelector';

interface JsonLdScriptProps {
  jsonLd: null | WithContext<
    FAQPage | ItemList | Movie | Organization | Person | TVEpisode | TVSeries | VideoObject | WebSite
  >;
}

const JsonLdScript = ({ jsonLd }: JsonLdScriptProps) => {
  const isLoggedIn = useAppSelector(isLoggedInSelector);

  if (!jsonLd || isLoggedIn) {
    return null;
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />;
};

export default JsonLdScript;
