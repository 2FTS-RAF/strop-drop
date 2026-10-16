import { useEffect, useState } from "react";
import {
  Alert,
  AlertTitle,
  Button,
  Chip,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import WarningIcon from "@mui/icons-material/Warning";
import NotificationsOffIcon from "@mui/icons-material/NotificationsOff";
import { startAlarm, stopAlarm, unlockAlarmAudio } from "../utils/alarm-sound";

const SNOOZE_MS = 5 * 60 * 1000; // 5 minutes

const UNLOCK_EVENTS = ["pointerdown", "keydown", "touchend"] as const;

const BoundaryAlert: React.FC<{ crossedBoundaries: string[] }> = ({
  crossedBoundaries,
}) => {
  const [snoozedUntil, setSnoozedUntil] = useState<Date | null>(null);
  // Not persisted: alarms are always back on after a reload
  const [alarmsCeased, setAlarmsCeased] = useState(false);
  const isSmallScreen = useMediaQuery("(max-width: 768px)");

  // App.css forces 16px on all buttons; smaller on phones so both banner buttons fit on one row
  const buttonSx = {
    fontSize: isSmallScreen ? "0.75rem !important" : "0.8125rem !important",
  };

  const isCrossing = crossedBoundaries.length > 0;
  const isAlarmActive = isCrossing && !snoozedUntil && !alarmsCeased;

  // Browsers block audio until the user interacts with the page
  useEffect(() => {
    const unlock = () => {
      unlockAlarmAudio();
      UNLOCK_EVENTS.forEach((event) =>
        document.removeEventListener(event, unlock, true),
      );
    };
    UNLOCK_EVENTS.forEach((event) =>
      document.addEventListener(event, unlock, true),
    );

    return () =>
      UNLOCK_EVENTS.forEach((event) =>
        document.removeEventListener(event, unlock, true),
      );
  }, []);

  useEffect(() => {
    if (!isAlarmActive) return;

    startAlarm();
    return () => stopAlarm();
  }, [isAlarmActive]);

  // End the snooze after 5 minutes; the alert returns if still crossing
  useEffect(() => {
    if (!snoozedUntil) return;

    const timer = setTimeout(
      () => setSnoozedUntil(null),
      snoozedUntil.getTime() - Date.now(),
    );
    return () => clearTimeout(timer);
  }, [snoozedUntil]);

  const snooze = () => setSnoozedUntil(new Date(Date.now() + SNOOZE_MS));

  const ceaseAlarms = () => {
    setAlarmsCeased(true);
    setSnoozedUntil(null);
  };

  if (!isCrossing) return null;

  let content: React.ReactNode;

  if (alarmsCeased) {
    content = (
      <Alert
        severity="error"
        variant="filled"
        icon={<NotificationsOffIcon fontSize="small" />}
        action={
          <Button
            color="inherit"
            size="small"
            sx={buttonSx}
            onClick={() => setAlarmsCeased(false)}>
            Undo
          </Button>
        }
        sx={{
          py: 0,
          borderRadius: 4,
          alignItems: "center",
          "& .MuiAlert-icon, & .MuiAlert-action": { py: 0, pt: 0 },
        }}>
        Outside boundary – all alarms ceased
      </Alert>
    );
  } else if (snoozedUntil) {
    content = (
      <Chip
        color="error"
        size="small"
        icon={<WarningIcon />}
        label={`Outside boundary – alert snoozed until ${snoozedUntil.toLocaleTimeString(
          [],
          { hour: "2-digit", minute: "2-digit" },
        )}`}
      />
    );
  } else {
    content = (
      <Alert
        severity="error"
        variant="filled"
        // Icon hidden on phones to leave room for both buttons on one row
        icon={isSmallScreen ? false : <WarningIcon />}
        // Let the message fill the banner so the buttons can sit at either edge
        sx={{ "& .MuiAlert-message": { flexGrow: 1 } }}>
        <AlertTitle>Strop impact area crosses the airfield boundary</AlertTitle>
        <Typography variant="body2">
          Crosses: {crossedBoundaries.join(", ")}
        </Typography>
        <Stack
          direction="row"
          justifyContent="space-between"
          spacing={1}
          useFlexGap
          flexWrap="wrap"
          sx={{ mt: 1.5 }}>
          <Button
            color="inherit"
            variant="outlined"
            size="small"
            sx={buttonSx}
            onClick={snooze}>
            Snooze 5 mins
          </Button>
          <Button
            color="inherit"
            size="small"
            startIcon={isSmallScreen ? undefined : <NotificationsOffIcon />}
            sx={buttonSx}
            onClick={ceaseAlarms}>
            Cease alerting
          </Button>
        </Stack>
      </Alert>
    );
  }

  const isBanner = !alarmsCeased && !snoozedUntil;

  return (
    // Sits between the zoom controls and, on desktop, the wind dial
    <div
      style={{
        position: "absolute",
        top: 10,
        left: 54,
        right: isSmallScreen ? 10 : 120,
        zIndex: 1100,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none", // keep the map draggable either side
      }}>
      <div
        style={{
          maxWidth: 560,
          width: isBanner ? "100%" : "auto",
          pointerEvents: "auto",
        }}>
        {content}
      </div>
    </div>
  );
};

export default BoundaryAlert;
