export const isComingSoonContent = (availabilityStarts: string | null | undefined) => {
  if (!availabilityStarts) return false;
  return new Date(availabilityStarts) > new Date();
};
