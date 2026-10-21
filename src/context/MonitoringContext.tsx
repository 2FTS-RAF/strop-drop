import { createContext, useContext } from 'react';
import { MonitoringContextType } from './MonitoringProvider';

export const MonitoringContext = createContext<MonitoringContextType | undefined>(undefined);
export const useMonitoring = (): MonitoringContextType => {
  const context = useContext(MonitoringContext);

  if (!context) {
    throw new Error('useMonitoring must be used within a MonitoringProvider');
  }
  return context;
};
