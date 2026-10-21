import { useEffect } from "react";
import { Alert, Snackbar } from "@mui/material";
import { useLiveWind } from "../context/LiveWindContext";
import { useMonitoring } from "../context/MonitoringContext";
import {
  installAudioUnlock,
  startChime,
  stopChime,
} from "../utils/alarm-sound";

const LiveWindErrorSnackbar = () => {
  const { error, dismissError } = useLiveWind();
  const { isMonitoring } = useMonitoring();
  const isOpen = error !== null;
  const isChiming = isOpen && isMonitoring;

  // Browsers block audio until the user interacts with the page
  useEffect(() => installAudioUnlock(), []);

  // In monitoring mode, chime occasionally until the message is dismissed
  useEffect(() => {
    if (!isChiming) return;

    startChime();
    return () => stopChime();
  }, [isChiming]);

  return (
    // Stays open until dismissed, so the chime only stops when the user acknowledges it
    <Snackbar
      open={isOpen}
      onClose={(_, reason) => {
        if (reason !== "clickaway") dismissError();
      }}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      // Below the header (56px on phones, 64px wider) so the monitoring switch stays visible
      sx={{ top: { xs: 64, sm: 76 } }}>
      <Alert
        onClose={dismissError}
        severity="error"
        variant="filled"
        sx={{ width: "100%" }}>
        Live wind unavailable – switched to manual wind.
        {error && ` (${error})`}
      </Alert>
    </Snackbar>
  );
};

export default LiveWindErrorSnackbar;
