import type { ReactNode } from 'react';
import React, { createContext, useMemo, useState } from 'react';

import type { Experiment } from 'common/experiments/Experiment';

type ExperimentMap = { [key: string]: Experiment };

export const YouboraExperimentMapContext = createContext<{ map: ExperimentMap; updateMap:(map: ExperimentMap) => void; } | undefined>(undefined);

export function YouboraExperimentMapProvider({ children }: { children?: ReactNode }) {
  const [state, setState] = useState<ExperimentMap>({});
  const provided = useMemo(() => ({
    map: state,
    updateMap: (value: ExperimentMap) => setState(value),
  }), [state]);
  return <YouboraExperimentMapContext.Provider value={provided}>{children}</YouboraExperimentMapContext.Provider>;
}

