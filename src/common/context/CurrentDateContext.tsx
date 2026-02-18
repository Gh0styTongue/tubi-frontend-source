import type { ComponentType, FC, PropsWithChildren } from 'react';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { FREEZED_EMPTY_FUNCTION } from '../constants/constants';

const ONE_MINUTE = 60_000;

type CurrentDateContextType = {
  currentDate: Date;
  forceUpdate: VoidFunction;
};

export const CurrentDateContext = createContext<CurrentDateContextType>({
  currentDate: new Date(),
  forceUpdate: FREEZED_EMPTY_FUNCTION,
});

const getTimeToNextMinute = () => ONE_MINUTE - Date.now() % ONE_MINUTE;

export const CurrentDateProvider: FC<PropsWithChildren<{ forceDate?: Date }>> = ({ children, forceDate }) => {
  const [currentDate, setCurrentDate] = useState<Date>(forceDate || new Date());
  const forceUpdate = useCallback(() => setCurrentDate(new Date()), []);

  const value: CurrentDateContextType = useMemo(() => ({
    currentDate,
    forceUpdate,
  }), [currentDate, forceUpdate]);

  useEffect(() => {
    if (forceDate) {
      return;
    }

    // immediately update the current date
    setCurrentDate(new Date());

    let intervalId: ReturnType<typeof setInterval> | undefined;

    // wait for the beginning of the next minute
    const timerId: ReturnType<typeof setTimeout> = setTimeout(() => {
      setCurrentDate(new Date());

      // update the current date again at the beginning of every minute (ish)
      intervalId = setInterval(() => {
        setCurrentDate(new Date());
      }, ONE_MINUTE);
    }, getTimeToNextMinute());

    return () => {
      clearTimeout(timerId);
      clearInterval(intervalId);
    };
  }, [forceDate]);

  return <CurrentDateContext.Provider value={value}>{children}</CurrentDateContext.Provider>;
};

export const useCurrentDate = () => useContext(CurrentDateContext).currentDate;

export type WithCurrentDateProps = {
  currentDate: Date;
};

type WithoutCurrentDateProps<PROPS extends object> = Omit<PROPS, keyof WithCurrentDateProps>;

export const withCurrentDate =
  <PROPS extends WithCurrentDateProps>(Component: ComponentType<PROPS>) =>
    (ownProps: WithoutCurrentDateProps<PROPS>) => {
      const currentDate = useCurrentDate();
      return <Component {...({ ...ownProps, currentDate } as PROPS)} />;
    };
