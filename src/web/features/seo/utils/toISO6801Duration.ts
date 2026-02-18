const ISO6801Map = [
  { timeStamp: 'H', secondsInTimePeriod: 60 * 60 }, // hours
  { timeStamp: 'M', secondsInTimePeriod: 60 }, // minutes
  { timeStamp: 'S', secondsInTimePeriod: 1 }, // seconds
];

/**
 * returns a string duration representation based on ISO 8601.
 * https://en.wikipedia.org/wiki/ISO_8601#Durations
 *
 * starts with 'PT'
 * if #Hour(s) > 0 then: #Hours + 'H'
 * if #Minute(s) > 0 then: #Minutes + 'M'
 * if #Second(s) > 0 then: #Seconds + 'S'
 * for example 4341 will result in 'PT1H12M21S', 422441 => 'PT117H20M41S'
 */
export const toISO6801Duration = (durationInSeconds: number | string) => {
  let val = typeof durationInSeconds === 'string' ? parseInt(durationInSeconds, 10) : durationInSeconds;

  if (isNaN(val)) {
    throw new Error('Please provide a valid number or string representation');
  }

  let durationISO = 'PT';

  ISO6801Map.forEach((map) => {
    const timeSpan = Math.floor(val / map.secondsInTimePeriod);
    durationISO += timeSpan ? `${timeSpan}${map.timeStamp}` : '';
    val -= timeSpan * map.secondsInTimePeriod;
  });

  return durationISO;
};
