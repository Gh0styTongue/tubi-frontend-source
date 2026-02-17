import { days, hours, mins, secs } from '@adrise/utils/lib/time';
import debounce from 'lodash/debounce';
import React, { useEffect, useState } from 'react';

const one = {
  sec: secs(1),
  min: mins(1),
  hour: hours(1),
  day: days(1),
};

function relativeTimeString(ts: Date): string {
  const timeAgoMs = Date.now() - ts.getTime();
  const timeAgo = {
    days: timeAgoMs / one.day,
    hours: timeAgoMs / one.hour,
    mins: timeAgoMs / one.min,
  };
  if (timeAgo.days > 1) {
    return `${Math.floor(timeAgo.days)}d`;
  }
  if (timeAgo.hours > 1) {
    return `${Math.floor(timeAgo.hours)}h`;
  }
  if (timeAgo.mins < 1) {
    return '<1m';
  }
  return `${Math.floor(timeAgo.mins)}m`;
}

interface Props {
  ts: Date;
}

const textUpdateFunctions: VoidFunction[] = [];
// Debounce the updates to the timestamps so that closely grouped exposures' timestamps are updated together and we
// don't cause the overlay to update one item at a time every minute. It is too distracting otherwise, since as humans
// we are hardwired to pick up movement at the periphery of our vision. So we want to minimize and batch movement, not
// have a possible cascade of them.
const callAllTextUpdateFunctions = debounce(
  () => textUpdateFunctions.forEach(fn => fn()),
  secs(5),
  {
    leading: true,
    trailing: true,
    maxWait: secs(10),
  },
);
function registerTextUpdateFunction(fn: VoidFunction): VoidFunction {
  textUpdateFunctions.push(fn);
  return () => {
    const index = textUpdateFunctions.indexOf(fn);
    if (index >= 0) {
      textUpdateFunctions.splice(index, 1);
    }
  };
}
export default function RelativeTimestamp({ ts }: Props) {
  const [text, setText] = useState(relativeTimeString(ts));
  useEffect(() => {
    const removeTextUpdateFunction = registerTextUpdateFunction(() => {
      const newText = relativeTimeString(ts);
      if (newText !== text) {
        setText(newText);
      }
    });
    // Each timestamp maintains its own interval timer, but the text updates are batched together thanks to the debounced
    // callAllTextUpdateFunctions.
    const intId = window.setInterval(callAllTextUpdateFunctions, one.min);
    return () => {
      window.clearInterval(intId);
      removeTextUpdateFunction();
    };
  }, [ts, text]);
  return <React.Fragment>{text}</React.Fragment>;
}
