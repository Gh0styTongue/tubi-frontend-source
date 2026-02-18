import React from 'react';
import { Helmet } from 'react-helmet-async';
import type {
  FAQPage,
  Graph,
  ItemList,
  Movie,
  Organization,
  Person,
  TVEpisode,
  TVSeries,
  VideoObject,
  SportsEvent,
  WebSite,
  WithContext,
} from 'schema-dts';

import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import useAppSelector from 'common/hooks/useAppSelector';

interface JsonLdScriptProps {
  jsonLd:
    | null
    | Graph
    | WithContext<FAQPage | ItemList | Movie | Organization | Person | TVEpisode | TVSeries | VideoObject | SportsEvent | WebSite>;
}

const JsonLdScript = ({ jsonLd }: JsonLdScriptProps) => {
  const isLoggedIn = useAppSelector(isLoggedInSelector);

  if (!jsonLd || isLoggedIn) {
    return null;
  }

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Helmet>
  );
};

export default JsonLdScript;
