import type experimentClient from './experiment.client';
import type experimentServer from './experiment.server';

let experiment: typeof experimentClient | typeof experimentServer;

if (__CLIENT__ || __TESTING__) {
  experiment = require('./experiment.client').default;
} else if (__SERVER__) {
  experiment = require('./experiment.server').default;
} else {
  throw new Error('Neither __CLIENT__ nor __SERVER__ is defined');
}

export default experiment;
