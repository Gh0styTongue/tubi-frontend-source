import type { Video } from 'common/types/video';

export const getIsEspanolContent = (content?: Video) => {
  if (!content) return false;
  const { lang = '' } = content;
  return lang.includes('Spanish') || lang.includes('Castilian');
};
