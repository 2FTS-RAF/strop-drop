import { Chip, Stack, Typography, useMediaQuery } from "@mui/material";
import React from "react";

const MapKeyContainer: React.FC = () => {

    const isSmallScreen = useMediaQuery("(max-width: 768px)"); // iPad landscape width is 1024px

  return (
    <div
      style={{
        position: "absolute",
        bottom: "20px",
        left: "10px",
        right: isSmallScreen ? "10px" : "auto",
        minWidth: "100px",
        zIndex: 1000,
        backgroundColor: "#ffffff94",
        padding: "5px",
        borderRadius: "20px",
        alignItems: "center",
      }}>
      <Stack
        direction={isSmallScreen ? "row" : "column"}
        spacing={1}
        alignItems="center"
        justifyContent={isSmallScreen ? "space-between" : "flex-start"}>
        {/* Shorter labels on mobile so all three keys fit on one row */}
        {!isSmallScreen && (
          <Typography variant="caption" align="center" sx={{ pl: 2 }}>
            Map Key:
          </Typography>
        )}
        <Chip
          label={isSmallScreen ? "Strop Impact Area" : "Potential Strop Impact Area"}
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
        <Chip
          label={isSmallScreen ? "Boundary" : "Airfield Boundary"}
          variant="outlined"
          size="small"
          sx={{
            flexGrow: 1,
            border: "2px dashed #4fc3f7",
            backgroundColor: "#ffffffcc",
          }}
        />
      </Stack>
    </div>
  );
};

export default MapKeyContainer;
