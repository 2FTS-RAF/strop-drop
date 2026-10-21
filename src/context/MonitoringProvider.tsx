import React, { useCallback, useState, type ReactNode } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { MonitoringContext } from "./MonitoringContext";
import { useParameters } from "./ParametersContext";
import { playChimeOnce } from "../utils/alarm-sound";

export interface MonitoringProviderProps {
  children: ReactNode;
}

export interface MonitoringContextType {
  /** Audible alerts for boundary crossings and live wind dropouts */
  isMonitoring: boolean;
  startMonitoring: () => void;
  /** Asks the user to confirm before monitoring is turned off */
  requestStopMonitoring: () => void;
}

// App.css forces 16px on all buttons
const buttonSx = { fontSize: "0.875rem !important" };

export const MonitoringProvider: React.FC<MonitoringProviderProps> = ({
  children,
}) => {
  const { parameters, setParameters } = useParameters();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Monitoring relies on live wind to notice changing conditions
  const startMonitoring = useCallback(() => {
    setParameters((prev) => ({
      ...prev,
      monitoringMode: true,
      windSource: "live",
    }));
    playChimeOnce(); // lets the user hear that sound is working
  }, [setParameters]);

  const requestStopMonitoring = useCallback(() => setIsConfirmOpen(true), []);

  const stopMonitoring = () => {
    setParameters((prev) => ({ ...prev, monitoringMode: false }));
    setIsConfirmOpen(false);
  };

  return (
    <MonitoringContext.Provider
      value={{
        isMonitoring: parameters.monitoringMode,
        startMonitoring,
        requestStopMonitoring,
      }}>
      {children}
      <Dialog
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        aria-labelledby="stop-monitoring-title">
        <DialogTitle id="stop-monitoring-title">Turn off monitoring?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You won't hear alarms if the strop impact area crosses an airfield
            boundary or live wind drops out. Messages will still show on the
            map.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "space-between", px: 3, pb: 2 }}>
          <Button
            variant="contained"
            autoFocus
            sx={buttonSx}
            onClick={() => setIsConfirmOpen(false)}>
            Keep monitoring
          </Button>
          <Button variant="outlined" color="error" sx={buttonSx} onClick={stopMonitoring}>
            Turn off
          </Button>
        </DialogActions>
      </Dialog>
    </MonitoringContext.Provider>
  );
};
