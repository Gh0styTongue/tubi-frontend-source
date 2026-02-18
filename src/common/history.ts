import { browserHistory, createMemoryHistory, hashHistory } from 'react-router';

const tubiHistory =
  __SERVER__
    ? createMemoryHistory()
    : __OTTPLATFORM__ === 'TIZEN'
      ? hashHistory // because it runs on the `file://` protocol, not `https://`
      : browserHistory;

export default tubiHistory;
