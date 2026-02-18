import { createContext, useContext } from 'react';

interface AddAccountContextValue {
  isKidsFlow: boolean;
}

export const AddAccountContext = createContext<AddAccountContextValue>({
  isKidsFlow: false,
});

export const useAddAccountContext = () => useContext(AddAccountContext);

