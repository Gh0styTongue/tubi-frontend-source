import SHA256 from 'crypto-js/sha256';

import { WEB_ROUTES } from 'common/constants/routes';
import type { Video } from 'common/types/video';
import { encodePersonName } from 'common/utils/seo';
import type { PersonData } from 'web/features/person/types/person';
import { HOST, getCanonicalLink } from 'web/features/seo/utils/seo';

export const HASH_LENGTH = 6;

export const getHashedName = (name: string) => {
  const hash = SHA256(name).toString();
  return hash.slice(0, HASH_LENGTH);
};

export const getPersonPath = (personName: string) => {
  const name = encodePersonName(personName).replace(/^person-/, '');
  const url = getCanonicalLink(WEB_ROUTES.person, { id: getHashedName(name), name });
  return url.replace(HOST, '');
};

export const filterByPersonName = (name: string) => (video: Video) => {
  const encodedName = encodePersonName(name);
  const persons = [...(video.actors || []), ...(video.directors || [])];
  const encodedNames = persons.map((name) => encodePersonName(name));
  return encodedNames.includes(encodedName);
};

export const getPersonUrl = (name: string) => {
  const path = getPersonPath(name);
  return `${HOST}${path}`;
};

export const getConnections = ({ name, videos }: PersonData) => {
  const MAX_CONNECTIONS = 5;
  const MIN_CONNECTIONS = 3;
  const MIN_COUNT_THRESHOLD = 2;

  const connectionMap: {
    [key: string]: number;
  } = {};

  videos.forEach((video) => {
    const persons = [...(video.actors || []), ...(video.directors || [])];

    if (persons.includes(name)) {
      persons.forEach((person) => {
        if (person !== name) {
          connectionMap[person] = connectionMap[person] ? connectionMap[person] + 1 : 1;
        }
      });
    }
  });

  const topConnections = Object.entries(connectionMap)
    .filter(([, count]) => count >= MIN_COUNT_THRESHOLD)
    .sort(([, countA], [, countB]) => countB - countA)
    .slice(0, MAX_CONNECTIONS);

  if (topConnections.length < MIN_CONNECTIONS) {
    return [];
  }

  return topConnections.map(([name]) => name);
};
