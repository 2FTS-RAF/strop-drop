import { useParameters } from "../context/ParametersContext";
import {
  Slider,
  Typography,
  Stack,
  Chip,
  AccordionDetails,
  Button,
  Tooltip,
  Alert,
  Link,
  ToggleButton,
  ToggleButtonGroup,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { createSvgIcon } from "@mui/material/utils";
import { AccordionProps } from "@mui/material/Accordion";
import MuiAccordionSummary from "@mui/material/AccordionSummary";
import ArrowForwardIosSharpIcon from "@mui/icons-material/ArrowForwardIosSharp";
import { AccordionSummaryProps } from "@mui/material/AccordionSummary";
import MuiAccordion from "@mui/material/Accordion";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import WarningIcon from "@mui/icons-material/Warning";
import SignalCellularAltIcon from "@mui/icons-material/SignalCellularAlt";
import AirIcon from "@mui/icons-material/Air";
import SwapCallsIcon from "@mui/icons-material/SwapCalls";
import SecurityIcon from "@mui/icons-material/Security";
import SaveIcon from "@mui/icons-material/Save";
import SensorsIcon from "@mui/icons-material/Sensors";
import TuneIcon from "@mui/icons-material/Tune";
import UpdateIcon from "@mui/icons-material/Update";
import FlightLandIcon from "@mui/icons-material/FlightLand";
import GrassIcon from "@mui/icons-material/Grass";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import WaterDropIcon from "@mui/icons-material/WaterDrop";

import { useLiveWind } from "../context/LiveWindContext";
import { calculateTerminalVelocity } from "../utils/calculate-strop-drift";
import { LIVE_WIND_POLL_INTERVAL_MS } from "../utils/fetch-live-wind";
import {
  getLandingDistances,
  LANDING_SAFETY_FACTORS,
} from "../utils/landing-area";
import type { RunwaySurface } from "../utils/ask21Landing";
import LaunchProfileControl from "./LaunchProfileControl";
import LandingAreaDiagram from "./LandingAreaDiagram";
import SavedScenarios from "./savedScenarios";
import { config } from "../config/env";

const Accordion = styled((props: AccordionProps) => (
  <MuiAccordion disableGutters elevation={0} square {...props} />
))(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  "&:not(:last-child)": {
    borderBottom: 0,
  },
  "&::before": {
    display: "none",
  },
}));

const AccordionSummary = styled((props: AccordionSummaryProps) => (
  <MuiAccordionSummary
    expandIcon={<ArrowForwardIosSharpIcon sx={{ fontSize: "0.9rem" }} />}
    {...props}
  />
))(({ theme }) => ({
  backgroundColor: "rgba(0, 0, 0, .03)",
  [`&.Mui-expanded`]: {
    backgroundColor: theme.palette.grey[300],
  },
}));

const MobileOptimizedSlider = styled(Slider)({
  '& .MuiSlider-thumb': {
    width: 28,
    height: 28,
  },
  '& .MuiSlider-track': {
    height: 8,
  },
  '& .MuiSlider-rail': {
    height: 8,
  },
});

// Toggle buttons with an icon and a label
const iconToggleSx = {
  "& .MuiToggleButton-root": {
    // App.css forces 16px on all buttons, which wraps these labels on mobile.
    // On phones the icon sits above a sentence-case label so it fits at 320px.
    fontSize: { xs: "0.75rem !important", sm: "0.8125rem !important" },
    flexDirection: { xs: "column", sm: "row" },
    textTransform: { xs: "none", sm: "uppercase" },
    lineHeight: { xs: 1.3, sm: 1.75 },
    whiteSpace: "nowrap",
    gap: 0.5,
    px: 1,
  },
  "& .MuiSvgIcon-root": { fontSize: "1.1rem" },
} as const;

// Runway seen from above: edge lines and a dashed centreline (MUI has no plain road icon)
const TarmacIcon = createSvgIcon(
  <path d="M5 2h1.75v20H5zM17.25 2H19v20h-1.75zM11.1 3h1.8v4h-1.8zm0 7h1.8v4h-1.8zm0 7h1.8v4h-1.8z" />,
  "Tarmac",
);

const SettingsPanel = () => {
  const { parameters, setParameters, resetStropParameters } = useParameters();
  const { isLoading, lastUpdated } = useLiveWind();
  const isLive = parameters.windSource === "live";

  const appOrg = config.APP_ORGANIZATION;

  const handleChange = (
    key: string,
    value: string | number | boolean | object,
  ) => {
    setParameters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const landingDistances = getLandingDistances(
    parameters.headWindComponent,
    parameters.landingSurface,
    parameters.landingSafetyFactor,
  );
  const isTarmac = parameters.landingSurface.endsWith("Tarmac");
  const isWet = parameters.landingSurface.startsWith("wet");
  const setLandingSurface = (tarmac: boolean, wet: boolean) =>
    handleChange(
      "landingSurface",
      `${wet ? "wet" : "dry"}${tarmac ? "Tarmac" : "Grass"}` as RunwaySurface,
    );

  const terminalVelocity = calculateTerminalVelocity(
    parameters.stropWeight,
    parameters.stropDiameter,
    parameters.stropLength,
  );

  return (
    <Stack>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <SignalCellularAltIcon sx={{ opacity: 0.5 }} />
            <Typography>Launch Profile</Typography>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={1}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center">
              <Typography variant="caption">
                Expected Full Launch Height
              </Typography>
              {parameters.releaseHeight > parameters.theroreticalMaxHeight ? (
                <Tooltip
                  title={`Warning: The release height exceeds the theoretical maximum of ${parameters.theroreticalMaxHeight}ft based on the cable length and headwind component.`}>
                  <Chip
                    label={`${parameters.releaseHeight} ft`}
                    color="error"
                    icon={<WarningIcon fontSize="small" />}
                  />
                </Tooltip>
              ) : (
                <Chip
                  label={`${parameters.releaseHeight} ft`}
                  color="default"
                />
              )}
            </Stack>
            <MobileOptimizedSlider
              value={parameters.releaseHeight}
              onChange={(_, value) =>
                handleChange("releaseHeight", value as number)
              }
              onChangeCommitted={(_, value) =>
                handleChange("releaseHeight", value as number)
              }
              min={100}
              max={3000}
              step={100}
              color="info"
              valueLabelDisplay="auto"
            />
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center">
              <Typography variant="caption">Surface Wind Speed</Typography>
              <Chip
                label={`${parameters.surfaceWind.speed} kts`}
                color="primary"
              />
            </Stack>
            <MobileOptimizedSlider
              value={parameters.surfaceWind.speed}
              onChange={(_, value) =>
                handleChange("surfaceWind", {
                  ...parameters.surfaceWind,
                  speed: value as number,
                })
              }
              onChangeCommitted={(_, value) =>
                handleChange("surfaceWind", {
                  ...parameters.surfaceWind,
                  speed: value as number,
                })
              }
              min={1}
              max={50}
              step={1}
              valueLabelDisplay="auto"
              disabled={isLive}
            />
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center">
              <Typography variant="caption">2000ft Wind Speed</Typography>
              <Chip
                label={`${parameters.twoThousandFtWind.speed} kts`}
                color="error"
              />
            </Stack>
            <MobileOptimizedSlider
              value={parameters.twoThousandFtWind.speed}
              onChange={(_, value) =>
                handleChange("twoThousandFtWind", {
                  ...parameters.twoThousandFtWind,
                  speed: value as number,
                })
              }
              onChangeCommitted={(_, value) =>
                handleChange("twoThousandFtWind", {
                  ...parameters.twoThousandFtWind,
                  speed: value as number,
                })
              }
              min={1}
              max={50}
              step={1}
              color="error"
              valueLabelDisplay="auto"
              disabled={isLive}
            />
            <LaunchProfileControl
              activeWind={parameters.surfaceWind.speed}
              twoKWind={parameters.twoThousandFtWind.speed}
              maxHeight={parameters.releaseHeight}
              maxCableLength={parameters.cableLength}
            />
          </Stack>
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <AirIcon sx={{ opacity: 0.5 }} />
            <Typography>Wind Controls</Typography>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <ToggleButtonGroup
              value={parameters.windSource}
              exclusive
              fullWidth
              size="small"
              color="primary"
              onChange={(_, value) => {
                if (value) handleChange("windSource", value);
              }}
              sx={iconToggleSx}>
              <ToggleButton value="live">
                <SensorsIcon />
                Live wind
              </ToggleButton>
              <ToggleButton value="manual">
                <TuneIcon />
                Manual override
              </ToggleButton>
            </ToggleButtonGroup>
            {isLive && (
              <Alert severity="info">
                <Stack spacing={1}>
                  <Typography variant="body2">
                    Live wind at the launch point is being used. It updates
                    automatically{" "}
                    <strong>
                      every {LIVE_WIND_POLL_INTERVAL_MS / 60000} minutes
                    </strong>
                    .
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="caption">Last updated</Typography>
                    <Chip
                      size="small"
                      color="info"
                      icon={<UpdateIcon />}
                      label={
                        isLoading && !lastUpdated
                          ? "Fetching…"
                          : (lastUpdated?.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            }) ?? "–")
                      }
                    />
                  </Stack>
                  <Typography variant="caption">
                    Weather data by{" "}
                    <Link
                      href="https://open-meteo.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ whiteSpace: "nowrap" }}>
                      Open-Meteo.com
                    </Link>{" "}
                    (Met Office UKMO model)
                  </Typography>
                </Stack>
              </Alert>
            )}
            <Stack spacing={3} direction="row" justifyContent="space-between">
              <Stack justifyContent="space-around" alignItems="center">
                <Typography variant="caption">Surface Wind</Typography>
                <Chip
                  label={`${parameters.surfaceWind.direction
                    .toString()
                    .padStart(3, "0")}° ${parameters.surfaceWind.speed} kts`}
                  color="primary"
                />
              </Stack>
              <Stack flexGrow={1}>
                <MobileOptimizedSlider
                  value={parameters.surfaceWind.direction}
                  onChange={(_, value) =>
                    handleChange("surfaceWind", {
                      ...parameters.surfaceWind,
                      direction: value as number,
                    })
                  }
                  onChangeCommitted={(_, value) =>
                    handleChange("surfaceWind", {
                      ...parameters.surfaceWind,
                      direction: value as number,
                    })
                  }
                  min={5}
                  max={360}
                  step={5}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `${value}°`}
                  disabled={isLive}
                />
                <MobileOptimizedSlider
                  value={parameters.surfaceWind.speed}
                  onChange={(_, value) =>
                    handleChange("surfaceWind", {
                      ...parameters.surfaceWind,
                      speed: value as number,
                    })
                  }
                  onChangeCommitted={(_, value) =>
                    handleChange("surfaceWind", {
                      ...parameters.surfaceWind,
                      speed: value as number,
                    })
                  }
                  min={0}
                  max={50}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `${value} kts`}
                  disabled={isLive}
                />
              </Stack>
            </Stack>
            <Stack spacing={3} direction="row" justifyContent="space-between">
              <Stack justifyContent="space-around" alignItems="center">
                <Typography variant="caption">2000ft Wind</Typography>
                <Chip
                  label={`${parameters.twoThousandFtWind.direction
                    .toString()
                    .padStart(3, "0")}° ${
                    parameters.twoThousandFtWind.speed
                  } kts`}
                  color="error"
                />
              </Stack>
              <Stack flexGrow={1}>
                <MobileOptimizedSlider
                  color="error"
                  value={parameters.twoThousandFtWind.direction}
                  onChange={(_, value) =>
                    handleChange("twoThousandFtWind", {
                      ...parameters.twoThousandFtWind,
                      direction: value as number,
                    })
                  }
                  onChangeCommitted={(_, value) =>
                    handleChange("twoThousandFtWind", {
                      ...parameters.twoThousandFtWind,
                      direction: value as number,
                    })
                  }
                  min={5}
                  max={360}
                  step={5}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `${value}°`}
                  disabled={isLive}
                />
                <MobileOptimizedSlider
                  color="error"
                  value={parameters.twoThousandFtWind.speed}
                  onChange={(_, value) =>
                    handleChange("twoThousandFtWind", {
                      ...parameters.twoThousandFtWind,
                      speed: value as number,
                    })
                  }
                  onChangeCommitted={(_, value) =>
                    handleChange("twoThousandFtWind", {
                      ...parameters.twoThousandFtWind,
                      speed: value as number,
                    })
                  }
                  min={0}
                  max={50}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `${value} kts`}
                  disabled={isLive}
                />
              </Stack>
            </Stack>
          </Stack>
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <FlightLandIcon sx={{ opacity: 0.5 }} />
            <Typography>Landing Area</Typography>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            {/* Some airfields land away from the launch point, where the graphic is a distraction */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={parameters.showLandingArea}
                  onChange={(event) =>
                    handleChange("showLandingArea", event.target.checked)
                  }
                />
              }
              label="Show landing area on map"
              slotProps={{ typography: { variant: "body2" } }}
            />
            <Stack
              direction="row"
              spacing={1}
              sx={iconToggleSx}>
              <ToggleButtonGroup
                value={isTarmac ? "tarmac" : "grass"}
                exclusive
                fullWidth
                size="small"
                color="primary"
                onChange={(_, value) => {
                  if (value) setLandingSurface(value === "tarmac", isWet);
                }}>
                <ToggleButton value="grass">
                  <GrassIcon />
                  Grass
                </ToggleButton>
                <ToggleButton value="tarmac">
                  <TarmacIcon />
                  Tarmac
                </ToggleButton>
              </ToggleButtonGroup>
              <ToggleButtonGroup
                value={isWet ? "wet" : "dry"}
                exclusive
                fullWidth
                size="small"
                color="primary"
                onChange={(_, value) => {
                  if (value) setLandingSurface(isTarmac, value === "wet");
                }}>
                <ToggleButton value="dry">
                  <WbSunnyIcon />
                  Dry
                </ToggleButton>
                <ToggleButton value="wet">
                  <WaterDropIcon />
                  Wet
                </ToggleButton>
              </ToggleButtonGroup>
            </Stack>
            <Stack spacing={1}>
              <Typography variant="caption">Safety Factor - Pilot Ability</Typography>
              {/* Side padding keeps the end mark labels inside the panel */}
              <Stack sx={{ px: 4 }}>
                <MobileOptimizedSlider
                  value={parameters.landingSafetyFactor}
                  onChange={(_, value) =>
                    handleChange("landingSafetyFactor", value as number)
                  }
                  min={LANDING_SAFETY_FACTORS[0].value}
                  max={LANDING_SAFETY_FACTORS[LANDING_SAFETY_FACTORS.length - 1].value}
                  step={null}
                  marks={LANDING_SAFETY_FACTORS.map(({ value, label }) => ({
                    value,
                    label,
                  }))}
                  sx={{ "& .MuiSlider-markLabel": { fontSize: "0.75rem" } }}
                />
              </Stack>
            </Stack>
            <LandingAreaDiagram
              headwindKt={parameters.headWindComponent}
              approachKt={landingDistances.approachAirspeedKt}
              groundRollM={landingDistances.groundRollM}
              referencePointM={landingDistances.aimPointToStopM}
              surface={parameters.landingSurface}
            />
            <Typography variant="caption" color="text.secondary">
              Based on typical 2-seat training glider at 600kg AUM with effective main wheel braking. Engineering
              estimate, not flight-manual data.
            </Typography>
          </Stack>
        </AccordionDetails>
      </Accordion>
      {appOrg !== "2fts" && (
        <>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <SwapCallsIcon sx={{ opacity: 0.5 }} />
                <Typography>Strop Controls</Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={1}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center">
                  <Typography variant="caption">Strop Length</Typography>
                  <Chip label={`${parameters.stropLength} m`} color="primary" />
                </Stack>
                <MobileOptimizedSlider
                  value={parameters.stropLength}
                  onChange={(_, value) =>
                    handleChange("stropLength", value as number)
                  }
                  onChangeCommitted={(_, value) =>
                    handleChange("stropLength", value as number)
                  }
                  min={1}
                  step={1}
                  max={10}
                  valueLabelDisplay="auto"
                />
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center">
                  <Typography variant="caption">Strop Diameter</Typography>
                  <Chip
                    label={`${(parameters.stropDiameter * 100).toFixed(0)} cm`}
                    color="primary"
                  />
                </Stack>
                <MobileOptimizedSlider
                  value={parameters.stropDiameter * 100}
                  onChange={(_, value) =>
                    handleChange("stropDiameter", (value as number) / 100)
                  }
                  onChangeCommitted={(_, value) =>
                    handleChange("stropDiameter", (value as number) / 100)
                  }
                  min={1}
                  step={1}
                  max={10}
                  valueLabelDisplay="auto"
                />
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center">
                  <Typography variant="caption">Strop Weight</Typography>
                  <Chip
                    label={`${parameters.stropWeight} kg`}
                    color="primary"
                  />
                </Stack>
                <MobileOptimizedSlider
                  value={parameters.stropWeight}
                  onChange={(_, value) =>
                    handleChange("stropWeight", value as number)
                  }
                  onChangeCommitted={(_, value) =>
                    handleChange("stropWeight", value as number)
                  }
                  min={1}
                  step={0.5}
                  max={5}
                  valueLabelDisplay="auto"
                />
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center">
                  <Typography variant="caption">
                    Est. Terminal Velocity
                  </Typography>
                  <Chip
                    label={`${terminalVelocity.toFixed(2)} m/s`}
                    color="primary"
                  />
                </Stack>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={resetStropParameters}>
                  Default SkyLaunch Strop
                </Button>
              </Stack>
            </AccordionDetails>
          </Accordion>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <SecurityIcon sx={{ opacity: 0.5 }} />
                <Typography>Safety Margins</Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={3}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center">
                  <Typography variant="caption">Safety Buffer</Typography>
                  <Chip
                    label={`${parameters.safetyBuffer.toFixed(0)} %`}
                    color="primary"
                  />
                </Stack>
                <MobileOptimizedSlider
                  value={parameters.safetyBuffer}
                  onChange={(_, value) =>
                    handleChange("safetyBuffer", value as number)
                  }
                  onChangeCommitted={(_, value) =>
                    handleChange("safetyBuffer", value as number)
                  }
                  min={1}
                  step={1}
                  max={100}
                  valueLabelDisplay="auto"
                />
              </Stack>
            </AccordionDetails>
          </Accordion>
        </>
      )}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <SaveIcon sx={{ opacity: 0.5 }} />
            <Typography>Saved Scenarios</Typography>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <SavedScenarios />
        </AccordionDetails>
      </Accordion>
    </Stack>
  );
};

export default SettingsPanel;
