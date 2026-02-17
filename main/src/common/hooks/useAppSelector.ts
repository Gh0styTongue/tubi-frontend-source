import type { TypedUseSelectorHook } from 'react-redux';
import { useSelector } from 'react-redux';

import type StoreState from 'common/types/storeState';

const useAppSelector: TypedUseSelectorHook<StoreState> = useSelector;

export default useAppSelector;
