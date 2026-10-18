import { useEffect } from "react";
import { Alert, Snackbar } from "@mui/material";
import { useLiveWind } from "../context/LiveWindContext";
import {
  installAudioUnlock,
  startChime,
  stopChime,
} from "../utils/alarm-sound";

const LiveWindErrorSnackbar = () => {
  const { error, dismissError } = useLiveWind();
  const isOpen = error !== null;

  // Browsers block audio until the user interacts with the page
  useEffect(() => installAudioUnlock(), []);

  // Chime occasionally until the message is dismissed
  useEffect(() => {
    if (!isOpen) return;

    startChime();
    return () => stopChime();
  }, [isOpen]);

  return (
    // Stays open until dismissed, so the chime only stops when the user acknowledges it
    <Snackbar
      open={isOpen}
      onClose={(_, reason) => {
        if (reason !== "clickaway") dismissError();
      }}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}>
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
