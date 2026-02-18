import { useDispatch } from 'react-redux';

import type { TubiThunkDispatch } from 'common/types/reduxThunk';

export const useAppDispatch: () => TubiThunkDispatch = useDispatch;

export default useAppDispatch;
