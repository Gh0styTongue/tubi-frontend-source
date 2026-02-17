import classNames from 'classnames';
import React, { useEffect, useRef } from 'react';
import { connect } from 'react-redux';

import getInstance from 'common/experiments/ExperimentManager';
import { useExperimentStore } from 'common/experiments/ExperimentStoreContext';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';

import computeExposureLogEntries from './computeExposureLogEntries';
import styles from './ExposureLogOverlay.scss';
import { mapStateToProps } from './mapStateToProps';
import RelativeTimestamp from './RelativeTimeStamp';
import { markExposuresSeen } from './storeExposures';
import type { ExposureLogProps, ExposureLogEntry } from './types';

const ENTRIES_TO_SHOW = 4; // Max of 4 entries to show right now. We may wish to make this configurable later if necessary.

function ExposureLogOverlay({ exposuresLogged }: ExposureLogProps) {
  const FEATURE_SWITCH_KEY = 'ExposureLogOverlay';
  const experimentManager = getInstance(useExperimentStore());
  const previousEntries = useRef<ExposureLogEntry[]>([]);
  const entries = computeExposureLogEntries(exposuresLogged, previousEntries.current, experimentManager);
  useEffect(() => {
    previousEntries.current = entries;
    markExposuresSeen(entries);
  }, [entries]);
  if (FeatureSwitchManager.isDefault(FEATURE_SWITCH_KEY) || entries.length === 0) {
    return null;
  }
  const hiddenEntryCount = Math.max(0, entries.length - ENTRIES_TO_SHOW);
  const entriesToRender = hiddenEntryCount > 0 ? entries.slice(0, ENTRIES_TO_SHOW) : entries;
  return (
    <div className={classNames(styles.exposureLogOverlay, styles.overlay)}>
      <strong>Exposures Sent</strong>
      <ul>
        {
          entriesToRender.map(({ ts, experiment, treatment: thisTreatment, isWhitelisted, isLocalOverride, treatmentsLogged }) => {
            let treatmentIndex = 0;
            return (
              <li key={experiment} className={styles.exposureLogItem}>
                <span className={styles.ts}><RelativeTimestamp ts={ts} /></span>
                <span className={styles.experiment}>{experiment.replace('webott_', '..._')}</span>
                <span className={styles.treatment}>
                  <span className={classNames(styles.pill, thisTreatment === 'control' ? styles.control : null)}>{thisTreatment}</span>
                  {isWhitelisted ? <span className={styles.whitelist}>WL</span> : null}
                  {isLocalOverride ? <span className={styles.whitelist}>LO</span> : null}
                </span>
                <span className={styles.loggedExposures}>
                  <span className={styles.treatments}>
                    {
                      Object.keys(treatmentsLogged).map(treatment => {
                        const className = treatment === thisTreatment
                          ? styles.current
                          : treatmentsLogged[treatment]
                            ? styles.logged
                            : styles.unlogged;
                        const treatmentName = treatment === 'control' ? 'C'
                          : <React.Fragment>V<sub>{treatmentIndex++}</sub></React.Fragment>;
                        return <span key={treatment} className={className}>{treatmentName}</span>;
                      })
                    }
                  </span>
                </span>
              </li>
            );
          })
        }
      </ul>
      { hiddenEntryCount > 0
        ? (
          <div className={styles.olderEntries}>
            ({hiddenEntryCount} older entr{hiddenEntryCount > 1 ? 'ies' : 'y'} not shown)
          </div>
        )
        : null }
    </div>
  );
}

export default connect(mapStateToProps)(ExposureLogOverlay);
