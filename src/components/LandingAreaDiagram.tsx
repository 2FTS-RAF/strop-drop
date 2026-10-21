import React from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import FlightIcon from "@mui/icons-material/Flight";
import type { RunwaySurface } from "../utils/ask21Landing";
import {
  LANDING_LINE_COLOURS,
  LANDING_SURFACE_COLOURS,
} from "../utils/landing-area";

interface LandingAreaDiagramProps {
  headwindKt: number;
  approachKt: number;
  groundRollM: number;
  referencePointM: number;
  surface: RunwaySurface;
}

// Fixed layout (not to scale), drawn as the pilot sees it: landing upward,
// aim line at the bottom, launch point and stop line at the top.
const HEIGHT = 284;
const STRIP_WIDTH = 64;
const STOP_Y = 64;
const TOUCHDOWN_Y = 140;
const AIM_Y = 206;

const stripLeft = `calc(50% - ${STRIP_WIDTH / 2}px)`;
const captionSx = { color: "common.white", lineHeight: 1.2 };

const Line: React.FC<{ y: number; colour: string }> = ({ y, colour }) => (
  <Box
    sx={{
      position: "absolute",
      top: y - 1.5,
      left: stripLeft,
      width: STRIP_WIDTH,
      height: 3,
      bgcolor: colour,
    }}
  />
);

// Dimension bracket beside the strip, open towards it
const Bracket: React.FC<{
  side: "left" | "right";
  from: number;
  to: number;
  colour: string;
}> = ({ side, from, to, colour }) => (
  <Box
    sx={{
      position: "absolute",
      top: from,
      height: to - from,
      width: 8,
      left:
        side === "left"
          ? `calc(50% - ${STRIP_WIDTH / 2 + 18}px)`
          : `calc(50% + ${STRIP_WIDTH / 2 + 10}px)`,
      border: `2px solid ${colour}`,
      [side === "left" ? "borderRight" : "borderLeft"]: "none",
    }}
  />
);

const DimensionLabel: React.FC<{
  side: "left" | "right";
  centreY: number;
  title: string;
  value: string;
  colour: string;
  textColour: string;
}> = ({ side, centreY, title, value, colour, textColour }) => (
  <Stack
    spacing={0.5}
    alignItems={side === "left" ? "flex-end" : "flex-start"}
    sx={{
      position: "absolute",
      top: centreY,
      transform: "translateY(-50%)",
      [side]: 6,
      // Stops short of the bracket beside the strip
      width: `calc(50% - ${STRIP_WIDTH / 2 + 30}px)`,
      textAlign: side === "left" ? "right" : "left",
    }}>
    <Typography variant="caption" sx={captionSx}>
      {title}
    </Typography>
    <Chip
      size="small"
      label={value}
      sx={{ bgcolor: colour, color: textColour, fontWeight: 500 }}
    />
  </Stack>
);

const LandingAreaDiagram: React.FC<LandingAreaDiagramProps> = ({
  headwindKt,
  approachKt,
  groundRollM,
  referencePointM,
  surface,
}) => {
  const isHeadwind = headwindKt >= 0;
  const WindArrow = isHeadwind ? ArrowDownwardIcon : ArrowUpwardIcon;

  return (
    <Box
      role="img"
      aria-label={`Landing area: ${isHeadwind ? "headwind" : "tailwind"} ${Math.abs(headwindKt)} knots, approach ${approachKt} knots, ground roll ${Math.round(groundRollM)} metres, reference point ${Math.round(referencePointM)} metres from the launch point`}
      sx={{
        position: "relative",
        height: HEIGHT,
        borderRadius: 2,
        overflow: "hidden",
        // Grass, like the satellite imagery on the map
        background: "linear-gradient(180deg, #44582f 0%, #34452a 100%)",
      }}>
      {/* Wind blows towards the glider for a headwind */}
      <Stack
        direction="row"
        spacing={0.75}
        alignItems="center"
        justifyContent="center"
        sx={{ position: "absolute", top: 10, left: 0, right: 0 }}>
        <WindArrow fontSize="small" sx={{ color: "common.white" }} />
        <Typography variant="caption" sx={captionSx}>
          {isHeadwind ? "Headwind Component" : "Tailwind Component"}
        </Typography>
        <Chip
          size="small"
          color="primary"
          label={`${Math.abs(headwindKt)} kts`}
          sx={{ fontWeight: 500 }}
        />
      </Stack>

      {/* Ground roll shading, touchdown to stop */}
      <Box
        sx={{
          position: "absolute",
          top: STOP_Y,
          height: TOUCHDOWN_Y - STOP_Y,
          left: stripLeft,
          width: STRIP_WIDTH,
          bgcolor: LANDING_SURFACE_COLOURS[surface],
          opacity: 0.55,
        }}
      />
      <Line y={STOP_Y} colour={LANDING_LINE_COLOURS.stop} />
      <Line y={TOUCHDOWN_Y} colour={LANDING_LINE_COLOURS.touchdown} />
      <Line y={AIM_Y} colour={LANDING_LINE_COLOURS.aim} />

      {/* Launch point marker, as on the map */}
      <Box
        sx={{
          position: "absolute",
          top: STOP_Y - 7,
          left: "calc(50% - 7px)",
          width: 14,
          height: 14,
          borderRadius: "50%",
          bgcolor: "common.white",
          boxShadow: "0 0 3px rgba(0,0,0,0.6)",
        }}
      />

      <Bracket
        side="left"
        from={STOP_Y}
        to={TOUCHDOWN_Y}
        colour={LANDING_LINE_COLOURS.touchdown}
      />
      <DimensionLabel
        side="left"
        centreY={(STOP_Y + TOUCHDOWN_Y) / 2}
        title="Ground Roll Dist."
        value={`${Math.round(groundRollM)} m`}
        colour={LANDING_LINE_COLOURS.touchdown}
        textColour="common.black"
      />
      <Bracket
        side="right"
        from={STOP_Y}
        to={AIM_Y}
        colour={LANDING_LINE_COLOURS.aim}
      />
      <DimensionLabel
        side="right"
        centreY={(STOP_Y + AIM_Y) / 2}
        title="Reference Point Dist."
        value={`${Math.round(referencePointM)} m`}
        colour={LANDING_LINE_COLOURS.aim}
        textColour="common.white"
      />

      {/* Glider on approach */}
      <FlightIcon
        sx={{
          position: "absolute",
          top: AIM_Y + 10,
          left: "calc(50% - 12px)",
          color: "common.white",
        }}
      />
      <Stack
        direction="row"
        spacing={0.75}
        alignItems="center"
        justifyContent="center"
        sx={{ position: "absolute", bottom: 10, left: 0, right: 0 }}>
        <Typography variant="caption" sx={captionSx}>
          Approach Speed
        </Typography>
        <Chip
          size="small"
          label={`${approachKt} kts`}
          sx={{ bgcolor: "rgba(255,255,255,0.9)", fontWeight: 500 }}
        />
      </Stack>
    </Box>
  );
};

export default LandingAreaDiagram;
