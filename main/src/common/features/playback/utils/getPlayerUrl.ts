import { OTT_ROUTES } from 'common/constants/routes';

export const getPlayerUrl = (id: string, trailerId?: string) => {
  if (__IS_ANDROIDTV_HYB_PLATFORM__ && !trailerId) {
    return `/ott/androidplayer/${id}`;
  }

  const baseUrl = `/ott/player/${id}`;

  if (trailerId) {
    const newTrailerId = parseInt(trailerId, 10);
    if (!isNaN(newTrailerId)) {
      return `${baseUrl}/trailer/${newTrailerId}`;
    }
  }

  return baseUrl;
};

export const getAdPlayerUrl = (id: string) => {
  return OTT_ROUTES.adPlayer.replace(':id', id);
};
