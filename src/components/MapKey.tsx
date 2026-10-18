import { Chip, Stack, Typography, useMediaQuery } from "@mui/material";
import React from "react";
import { LANDING_LINE_COLOURS } from "../utils/landing-area";

const MapKeyContainer: React.FC = () => {
  const isSmallScreen = useMediaQuery("(max-width: 768px)"); // iPad landscape width is 1024px

  const areaKeys = (
    <>
      <Chip
        label={isSmallScreen ? "Strop Impact" : "Strop Impact Area"}
        variant="filled"
        color="error"
        size="small"
        sx={{ flexGrow: 1 }}
      />
      <Chip
        label="Area of Drift"
        variant="filled"
        color="warning"
        size="small"
        sx={{ flexGrow: 1 }}
      />
    </>
  );

  const lineKeys = (
    <>
      <Chip
        label="Boundary"
        variant="outlined"
        size="small"
        sx={{
          flexGrow: 1,
          border: "2px dashed #4fc3f7",
          backgroundColor: "#ffffffcc",
        }}
      />
      <Chip
        label="Aim Point"
        size="small"
        sx={{
          flexGrow: 1,
          bgcolor: LANDING_LINE_COLOURS.aim,
          color: "common.white",
        }}
      />
      <Chip
        label="Touchdown"
        size="small"
        sx={{
          flexGrow: 1,
          bgcolor: LANDING_LINE_COLOURS.touchdown,
          color: "common.black",
        }}
      />
    </>
  );

  return (
    <div
      style={{
        position: "absolute",
        bottom: "20px",
        left: "10px",
        right: isSmallScreen ? "10px" : "auto",
        minWidth: "100px",
        zIndex: 1000,
        backgroundColor: "#ffffff7d",
        padding: "5px",
        borderRadius: isSmallScreen ? "16px" : "20px",
        alignItems: "center",
        backdropFilter: "blur(2px)",
      }}>
      {isSmallScreen ? (
        // Two rows on mobile, areas then lines, so every key fits; the wind dial sits above
        <Stack spacing={0.75}>
          <Stack direction="row" spacing={1}>
            {areaKeys}
          </Stack>
          <Stack direction="row" spacing={1}>
            {lineKeys}
          </Stack>
        </Stack>
      ) : (
        <Stack direction="column" spacing={1} alignItems="center">
          <Typography variant="caption" align="center" sx={{ pl: 2 }}>
            Map Key:
          </Typography>
          {areaKeys}
          {lineKeys}
        </Stack>
      )}
    </div>
  );
};

export default MapKeyContainer;
