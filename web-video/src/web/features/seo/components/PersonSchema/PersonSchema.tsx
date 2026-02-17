import React, { useMemo } from 'react';
import type { WithContext, Person } from 'schema-dts';

import type { PersonData } from 'web/features/person/types/person';
import { getPersonUrl } from 'web/features/person/utils/person';

import JsonLdScript from '../JsonLdScript/JsonLdScript';

export const getBasicPersonObject = (name: string): Person => ({
  '@type': 'Person',
  'name': name,
  'url': getPersonUrl(name),
});

export const getJobTitle = ({ name, videos }: PersonData) => {
  const jobTitle = new Set<'Actor' | 'Director'>();

  for (const video of videos) {
    if (video.actors?.includes(name)) {
      jobTitle.add('Actor');
    } else if (video.directors?.includes(name)) {
      jobTitle.add('Director');
    }
  }

  return Array.from(jobTitle);
};

// https://schema.org/Person
export const genJsonLd = ({ name, videos }: PersonData): WithContext<Person> => {
  const jobTitle = getJobTitle({ name, videos });

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    'name': name,
    'url': getPersonUrl(name),
    'jobTitle': jobTitle,
  };
};

const PersonSchema = (props: PersonData) => {
  const jsonLd = useMemo(() => genJsonLd(props), [props]);

  return <JsonLdScript jsonLd={jsonLd} />;
};

export default PersonSchema;
