/* istanbul ignore file */
import devStore from './configureStore.dev';
import prodStore from './configureStore.prod';

export default __DEVELOPMENT__ ? devStore : prodStore;
