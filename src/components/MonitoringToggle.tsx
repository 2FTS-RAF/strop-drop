import React from "react";
import { Button, IconButton, Tooltip, Typography } from "@mui/material";
import { keyframes } from "@mui/material/styles";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import NotificationsOffIcon from "@mui/icons-material/NotificationsOff";
import { useMonitoring } from "../context/MonitoringContext";

const monitoringPulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(102, 187, 106, 0.7); }
  70% { box-shadow: 0 0 0 8px rgba(102, 187, 106, 0); }
  100% { box-shadow: 0 0 0 0 rgba(102, 187, 106, 0); }
`;

// Header switch for monitoring mode; turning it off asks for confirmation
const MonitoringToggle: React.FC<{ isSmallScreen?: boolean }> = ({
  isSmallScreen,
}) => {
  const { isMonitoring, startMonitoring, requestStopMonitoring } =
    useMonitoring();

  const Icon = isMonitoring ? NotificationsActiveIcon : NotificationsOffIcon;
  const onClick = isMonitoring ? requestStopMonitoring : startMonitoring;
  const state = isMonitoring ? "ON" : "OFF";
  const tooltip = isMonitoring
    ? "Monitoring ON: audible alerts for boundary crossings and live wind dropouts. Click to turn off."
    : "Monitoring OFF: messages only, no sound. Click to start monitoring.";
  const pulseSx = isMonitoring
    ? {
        animation: `${monitoringPulse} 2s ease-out infinite`,
        "@media (prefers-reduced-motion: reduce)": { animation: "none" },
      }
    : {};

  return (
    <Tooltip title={tooltip}>
      {isSmallScreen ? (
        <IconButton
          onClick={onClick}
          aria-label={`Monitoring ${state}`}
          aria-pressed={isMonitoring}
          sx={{
            ml: "auto",
            flexDirection: "column",
            borderRadius: 2,
            px: 0.75,
            py: 0.25,
            color: isMonitoring ? "success.light" : "grey.500",
            ...pulseSx,
          }}>
          <Icon fontSize="small" />
          <Typography
            component="span"
            sx={{ fontSize: "0.625rem", fontWeight: 700, lineHeight: 1 }}>
            {state}
          </Typography>
        </IconButton>
      ) : (
        <Button
          onClick={onClick}
          aria-pressed={isMonitoring}
          variant={isMonitoring ? "contained" : "outlined"}
          color={isMonitoring ? "success" : "inherit"}
          startIcon={<Icon />}
          sx={{
            mr: 2,
            whiteSpace: "nowrap",
            // App.css forces 16px on all buttons
            fontSize: "0.8125rem !important",
            ...(!isMonitoring && { color: "grey.400", borderColor: "grey.600" }),
            ...pulseSx,
          }}>
          Monitoring {state}
        </Button>
      )}
    </Tooltip>
  );
};

export default MonitoringToggle;
