import { createContext, useContext } from 'react';
import { LiveWindContextType } from './LiveWindProvider';

export const LiveWindContext = createContext<LiveWindContextType | undefined>(undefined);
export const useLiveWind = (): LiveWindContextType => {
  const context = useContext(LiveWindContext);

  if (!context) {
    throw new Error('useLiveWind must be used within a LiveWindProvider');
  }
  return context;
};
