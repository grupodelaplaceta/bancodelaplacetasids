import { createContext, useContext } from 'react';
import { BankContextType } from '../types';

export const BankContext = createContext<BankContextType | undefined>(undefined);

export const useBank = () => {
  const context = useContext(BankContext);
  if (!context) throw new Error('BankContext missing');
  return context;
};
