import { Alert, Snackbar } from "@mui/material";
import { useLiveWind } from "../context/LiveWindContext";

const LiveWindErrorSnackbar = () => {
  const { error, dismissError } = useLiveWind();

  return (
    <Snackbar
      open={error !== null}
      autoHideDuration={10000}
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
