import PageLayout from "../components/PageLayout";
import {
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TableRow,
  TableCell,
  TableHead,
  TableBody,
  Divider,
  Box,
  Table,
  Stack,
  Slider,
  Paper,
  Chip,
  Alert,
  Grid,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import NotificationsOffIcon from "@mui/icons-material/NotificationsOff";
import {
  calculateStropHeights,
  calculateWindGradient,
  DEFAULT_LANDING_SAFETY_FACTOR,
  generateDynamicLaunchProfile,
  getLandingDistances,
  LANDING_LINE_COLOURS,
  LANDING_SAFETY_FACTORS,
  LANDING_SURFACE_COLOURS,
} from "../utils";
import LandingAreaDiagram from "../components/LandingAreaDiagram";
import { useState, type ReactNode } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TooltipItem,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { config } from "../config/env";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

// Example for the Landing Area section: 10kt headwind on dry grass, default pilot ability
const EXAMPLE_HEADWIND_KT = 10;
const exampleLanding = getLandingDistances(
  EXAMPLE_HEADWIND_KT,
  "dryGrass",
  DEFAULT_LANDING_SAFETY_FACTOR,
);

const BulletList = ({ items }: { items: ReactNode[] }) => (
  <Box component="ul" sx={{ m: 0, pl: 3 }}>
    {items.map((item, index) => (
      <Box component="li" key={index} sx={{ mb: 1 }}>
        {/* div, not p: items can contain chips, which render as divs */}
        <Typography component="div">{item}</Typography>
      </Box>
    ))}
  </Box>
);

const HelpPage = () => {
  const [surfaceWind, setSurfaceWind] = useState<{
    speed: number;
    direction: number;
  }>({ speed: 10, direction: 270 });
  const [twoKWind, setTwoKWind] = useState<{
    speed: number;
    direction: number;
  }>({ speed: 20, direction: 290 });
  const [launchHeight, setLaunchHeight] = useState<number>(2000);

  const stropHeights = calculateStropHeights(
    1000,
    launchHeight,
    surfaceWind.speed,
    [],
    twoKWind.speed,
  );

  const dynamicProfile = generateDynamicLaunchProfile(
    surfaceWind.speed,
    twoKWind.speed,
  );

  const windGradient = calculateWindGradient(
    surfaceWind.speed,
    twoKWind.speed,
    surfaceWind.direction,
    twoKWind.direction,
    launchHeight,
  );

  const windData: {
    height: number;
    windSpeed: number;
    windDirection: number;
    launchHeight: number;
  }[] = [];

  stropHeights.forEach((data) => {
    const closestWindData = windGradient.reduce((prev, curr) => {
      return Math.abs(curr.height - data.height) <
        Math.abs(prev.height - data.height)
        ? curr
        : prev;
    });

    windData.push({ ...closestWindData, launchHeight: data.height });
  });

  //remove first element
  windData.shift();

  // Create chart data for launch profiles
  const chartData = {
    labels: [
      "0%",
      "10%",
      "20%",
      "30%",
      "40%",
      "50%",
      "60%",
      "70%",
      "80%",
      "90%",
      "100%",
    ],
    datasets: [
      {
        label: "Dynamic profile",
        data: [0, ...dynamicProfile.map((val) => Math.round(val * launchHeight))],
        borderColor: "#ff7f0e",
        backgroundColor: "#ff7f0e20",
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: "Launch Profile by Wind Condition",
        font: { size: 16 },
      },
      legend: {
        position: "top" as const,
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        callbacks: {
          title: (context: TooltipItem<"line">[]) => {
            return `Launch Progress: ${context[0].label}`;
          },
          label: (context: TooltipItem<"line">) => {
            return `${context.dataset.label}: ${context.parsed.y} ft`;
          },
        },
      },
    },
    interaction: {
      mode: "nearest" as const,
      axis: "x" as const,
      intersect: false,
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Launch Progress (%)",
        },
        grid: {
          display: true,
          color: "rgba(0, 0, 0, 0.1)",
        },
      },
      y: {
        title: {
          display: true,
          text: "Height (ft)",
        },
        beginAtZero: true,
        max: launchHeight,
        grid: {
          display: true,
          color: "rgba(0, 0, 0, 0.1)",
        },
      },
    },
  };

  return (
    <PageLayout title="Help Guide">
      <Accordion defaultExpanded sx={{ bgcolor: "rgba(0, 0, 0, 0.03)" }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h5" fontWeight={600}>
            What does this app do?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 2,
              alignItems: "flex-start",
            }}>
            <Box sx={{ flex: 2 }}>
              <Typography>
                The Strop Drop Visualiser was created to assist users in
                calculating the likely impact areas for a cable strop when a
                weak link fails during winch launch operations. By inputting
                various parameters such as launch height, wind conditions and
                strop characteristics, users can visualise potential drop zones
                on an interactive map. This tool is designed to enhance safety
                and planning for glider pilots and ground crews by providing a
                clear visual representation of strop drop scenarios.
              </Typography>
            </Box>

            <Box
              sx={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
              <Box
                component="img"
                src={`${config.BASE_URL}glider-strop.jpeg`}
                alt="Strop Example"
                sx={{
                  width: "100%",
                  height: "auto",
                  borderRadius: 3,
                }}
              />
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>
      <Accordion sx={{ bgcolor: "rgba(0, 0, 0, 0.03)" }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h5" fontWeight={600}>
            Getting Started
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <Typography>
              Drag the winch and launch point to adjust their positions. Input
              your expected full height for the launch to see the likely strop
              drop zone. Surface and 2000ft wind conditions are filled in
              automatically from live weather, or you can set them yourself
              (see Live Wind below). Adjust the parameters to see how different
              conditions affect the drop.
            </Typography>
            {/* videos */}
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              sx={{ width: "100%" }}>
              <Box
                component="video"
                src={`${config.BASE_URL}launch.webm`}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                controls={false}
                sx={{
                  width: { xs: "100%", lg: "50%" },
                  height: "auto",
                  borderRadius: 3,
                }}
              />
              <Stack>
                <Box
                  component="video"
                  src={`${config.BASE_URL}wind.webm`}
                  controls={false}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                  sx={{
                    width: "100%",
                    height: "auto",
                  }}
                />
                <Box
                  component="video"
                  src={`${config.BASE_URL}map.webm`}
                  controls={false}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                  sx={{
                    width: "100%",
                    height: "auto",
                  }}
                />
              </Stack>
            </Stack>
          </Stack>
        </AccordionDetails>
      </Accordion>
      <Accordion sx={{ bgcolor: "rgba(0, 0, 0, 0.03)" }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h5" fontWeight={600}>
            How does it work?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <Typography>
              The Strop Drop Visualiser uses simplistic physics to simulate the
              likely behavior of a strop drop. By accounting for variables such
              as wind speed, direction and height, the app can predict the
              likely trajectory and landing zone of the dropped strop.
            </Typography>
            <Typography>
              Based on strop drop data from 2FTS and the RAFGSA it was
              determined that an average strop falls at approximately 20m/s.
              This value is used as a baseline for simulations, but actual drop
              speeds may vary based on specific conditions and the orientations
              in which the strop freefalls.
            </Typography>
            <Typography>
              By default a 25% safety margin is applied to all drop calculations
              to account for variability in real-world conditions. This is
              represented by the red 'impact area' on the map.
            </Typography>
            <Typography>
              The app works by calculating the intermediate wind speed and
              direction at each 10% interval of the launch profile. Knowing the
              height of the strop at that particular point we can then calculate
              the time it would take to reach the ground at 20m/s. This time is
              then used to determine the horizontal drift caused by the wind at
              that height, which is then applied to the strop drop trajectory to
              determine the likely landing zone.
            </Typography>

            {/* Interactive Controls */}
            <Divider />

            <Grid container spacing={2}>
              {/* Launch Profile Chart */}
              <Grid size={{ xs: 12, lg: 6 }}>
                <Paper elevation={1} sx={{ height: 400, width: "100%", mb: 2 }}>
                  <Line data={chartData} options={chartOptions} />
                </Paper>
                <Paper elevation={1} sx={{ width: "100%" }}>
                  <Box sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Adjust Parameters:
                    </Typography>
                    <Slider
                      value={launchHeight}
                      onChange={(_, newValue) => setLaunchHeight(newValue)}
                      aria-labelledby="launch-height-slider"
                      valueLabelDisplay="auto"
                      color="success"
                      step={100}
                      min={500}
                      max={3000}
                      valueLabelFormat={(value) =>
                        `Launch Height - ${value} ft`
                      }
                    />
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={4}>
                      <Slider
                        value={surfaceWind.speed}
                        onChange={(_, newValue) =>
                          setSurfaceWind({ ...surfaceWind, speed: newValue })
                        }
                        aria-labelledby="surface-wind-speed-slider"
                        valueLabelDisplay="auto"
                        step={1}
                        min={0}
                        max={50}
                        valueLabelFormat={(value) =>
                          `Surface Wind - ${value} kts`
                        }
                      />
                      <Slider
                        value={surfaceWind.direction}
                        onChange={(_, newValue) =>
                          setSurfaceWind({
                            ...surfaceWind,
                            direction: newValue,
                          })
                        }
                        aria-labelledby="surface-wind-direction-slider"
                        valueLabelDisplay="auto"
                        step={5}
                        min={0}
                        max={360}
                        valueLabelFormat={(value) => `Surface Wind - ${value}°`}
                      />
                    </Stack>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={4}>
                      <Slider
                        value={twoKWind.speed}
                        onChange={(_, newValue) =>
                          setTwoKWind({ ...twoKWind, speed: newValue })
                        }
                        aria-labelledby="2000ft-wind-speed-slider"
                        valueLabelDisplay="auto"
                        color="error"
                        step={1}
                        min={0}
                        max={50}
                        valueLabelFormat={(value) =>
                          `2000ft Wind - ${value} kts`
                        }
                      />
                      <Slider
                        value={twoKWind.direction}
                        color="error"
                        onChange={(_, newValue) =>
                          setTwoKWind({ ...twoKWind, direction: newValue })
                        }
                        aria-labelledby="2000ft-wind-direction-slider"
                        valueLabelDisplay="auto"
                        step={5}
                        min={0}
                        max={360}
                        valueLabelFormat={(value) => `2000ft Wind - ${value}°`}
                      />
                    </Stack>
                  </Box>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, lg: 6 }}>
                <Stack
                  direction="row"
                  spacing={2}
                  justifyContent="flex-start"
                  width="100%"
                  sx={{ mb: 2, flexWrap: "wrap", gap: 2 }}>
                  <Chip
                    label={`Launch: ${Math.round(launchHeight)} ft`}
                    color="success"
                    sx={{ mb: 1, flexGrow: 1 }}
                  />
                  <Chip
                    label={`Surface: ${surfaceWind.speed} kts at ${surfaceWind.direction}°`}
                    color="primary"
                    sx={{ mb: 1, flexGrow: 1 }}
                  />
                  <Chip
                    label={`2000ft: ${twoKWind.speed} kts at ${twoKWind.direction}°`}
                    color="error"
                    sx={{ mb: 1, flexGrow: 1 }}
                  />
                </Stack>
                <Table sx={{ width: "100%", tableLayout: "fixed" }}>
                  <TableHead sx={{ backgroundColor: "rgba(0, 0, 0, 0.05)" }}>
                    <TableRow>
                      <TableCell>Data Point</TableCell>
                      <TableCell>Height (ft)</TableCell>
                      <TableCell>Wind Speed (kts)</TableCell>
                      <TableCell>Wind Direction (°)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {windData.map((data, index) => (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{Math.round(data.launchHeight)}ft</TableCell>
                        <TableCell>{data.windSpeed.toFixed(2)} kts</TableCell>
                        <TableCell>{data.windDirection.toFixed(2)}°</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Grid>
            </Grid>
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Accordion sx={{ bgcolor: "rgba(0, 0, 0, 0.03)" }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h5" fontWeight={600}>
            Live Wind
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <Typography>
              Live wind fills in the surface and 2000ft winds automatically
              from the Met Office UKMO forecast model, at the position of the
              launch point. It is switched on by default.
            </Typography>
            <Typography variant="h6">How it works</Typography>
            <BulletList
              items={[
                "The surface wind is the model's 10m wind. The 2000ft wind uses the model's 600m level (about 1,970ft above sea level), the closest level it provides.",
                "The wind updates every 5 minutes. If the launch point moves more than 5km, for example after a location search or loading a saved scenario, it updates straight away.",
                "While new data is loading, the wind arrows on the wind panel are replaced by a spinner.",
                <>
                  The pulsing{" "}
                  <Chip
                    label="Live"
                    size="small"
                    sx={{ bgcolor: "#ef6c00", color: "common.white" }}
                  />{" "}
                  badge on the wind panel shows live wind is in use. Its
                  tooltip shows when the wind was last updated.
                </>,
              ]}
            />
            <Typography variant="h6">Live or manual wind</Typography>
            <Typography>
              In Settings → Wind Controls, choose <strong>Live wind</strong> or{" "}
              <strong>Manual override</strong>. While live wind is in use the
              wind sliders are greyed out and the panel shows when the data was
              last updated. Switching to manual keeps the current values as a
              starting point.
            </Typography>
            <Typography variant="h6">If live wind isn't available</Typography>
            <Typography>
              If the weather service can't be reached, returns an error, or has
              no data for the location, the app switches to manual wind, keeps
              the last wind values and shows a message. In monitoring mode a
              soft chime also repeats every 10 seconds until you close the
              message. The 2000ft level is only available over the UK, so live
              wind switches to manual outside the UK.
            </Typography>
            <Alert severity="warning">
              Live wind is a model forecast, not a measurement. Always check it
              against the conditions on the airfield.
            </Alert>
            <Typography variant="caption" color="text.secondary">
              Weather data by Open-Meteo.com
            </Typography>
          </Stack>
        </AccordionDetails>
      </Accordion>
      <Accordion sx={{ bgcolor: "rgba(0, 0, 0, 0.03)" }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h5" fontWeight={600}>
            Monitoring Mode
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <Typography>
              Monitoring mode lets you leave the app running, for example in a
              background tab at the launch point, and be alerted by sound if
              conditions change. It is off by default.
            </Typography>
            <Typography variant="h6">What it does</Typography>
            <BulletList
              items={[
                "If the strop impact area crosses an airfield boundary, the boundary message flashes and an alarm sounds until you respond.",
                "If live wind becomes unavailable, a soft chime repeats every 10 seconds until you close the message.",
                "With monitoring off you still see both messages, but without sound or flashing.",
              ]}
            />
            <Typography variant="h6">Turning it on and off</Typography>
            <Typography component="div">
              Use the switch in the header. It shows{" "}
              <Chip
                label="Monitoring ON"
                size="small"
                color="success"
                icon={<NotificationsActiveIcon />}
              />{" "}
              in green when monitoring is on and{" "}
              <Chip
                label="Monitoring OFF"
                size="small"
                variant="outlined"
                icon={<NotificationsOffIcon />}
              />{" "}
              when it is off. On phones it is a bell icon labelled ON or OFF.
            </Typography>
            <BulletList
              items={[
                "Turning monitoring on also switches the wind to live, so changing conditions are picked up, and plays a single chime so you know the sound is working.",
                "Turning monitoring off asks you to confirm first.",
                "The setting is remembered the next time you open the app.",
              ]}
            />
            <Typography variant="h6">About the sound</Typography>
            <Typography>
              Browsers only play sound after you have interacted with the page,
              so tapping Accept on the start screen is enough to allow it. On a
              desktop browser the alarm and chime keep sounding when the app is
              in a background tab. On iPhone and iPad the sound stops when the
              app is in the background or the screen is locked, and the silent
              switch mutes it, but the messages still show.
            </Typography>
            <Alert severity="warning">
              Monitoring only works while the app stays open with live wind
              updating. Keep your device's sound on, and on iPhone and iPad keep
              the app on screen.
            </Alert>
          </Stack>
        </AccordionDetails>
      </Accordion>
      <Accordion sx={{ bgcolor: "rgba(0, 0, 0, 0.03)" }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h5" fontWeight={600}>
            Airfield Boundary Alerts
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <Typography component="div">
              Where an airfield's boundary has been mapped it is drawn as a{" "}
              <Chip
                label="Airfield Boundary"
                size="small"
                variant="outlined"
                sx={{ border: "2px dashed #4fc3f7" }}
              />{" "}
              line. Boundaries are currently available for Cranwell and RAF
              Syerston.
            </Typography>
            <Typography variant="h6">When the alert triggers</Typography>
            <Typography>
              If the red Potential Strop Impact Area crosses or touches a
              boundary line, a red message appears at the top of the map. In
              monitoring mode its border flashes and an alarm sounds repeatedly
              until you respond.
            </Typography>
            <Typography variant="h6">Responding to the alarm</Typography>
            <Typography>
              In monitoring mode the message has two buttons:
            </Typography>
            <BulletList
              items={[
                <>
                  <strong>Snooze - 5 mins</strong> silences the alarm and
                  shows a small reminder with the time the snooze ends. If the
                  impact area still crosses the boundary after 5 minutes, the
                  flashing message and alarm return. <strong>Undo</strong> on
                  the reminder ends the snooze straight away.
                </>,
                <>
                  <strong>Stop monitoring</strong> turns monitoring mode off,
                  after you confirm. The message stays on the map while the
                  impact area crosses the boundary, but without sound.
                </>,
              ]}
            />
            <Alert severity="info">
              The alert checks for the impact area crossing a boundary line.
              An impact area that lies completely outside every boundary does
              not trigger it, so always check the map as well.
            </Alert>
          </Stack>
        </AccordionDetails>
      </Accordion>
      <Accordion sx={{ bgcolor: "rgba(0, 0, 0, 0.03)" }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h5" fontWeight={600}>
            Landing Area
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 3,
              alignItems: "flex-start",
            }}>
            <Stack spacing={2} sx={{ flex: 2 }}>
              <Typography>
                The landing area shows roughly how much ground an ASK 21 needs
                to land and stop in the current conditions. Gliders are assumed
                to land in the launch direction, towards the winch, and stop at
                the launch point.
              </Typography>
              <Typography variant="h6">On the map</Typography>
              <BulletList
                items={[
                  <>
                    <Chip
                      label="Aim Point"
                      size="small"
                      sx={{
                        bgcolor: LANDING_LINE_COLOURS.aim,
                        color: "common.white",
                      }}
                    />{" "}
                    line: the reference point to aim for on approach.
                  </>,
                  <>
                    <Chip
                      label="Touchdown"
                      size="small"
                      sx={{
                        bgcolor: LANDING_LINE_COLOURS.touchdown,
                        color: "common.black",
                      }}
                    />{" "}
                    line: where the glider is expected to touch down.
                  </>,
                  "White line: the stop point, through the launch point.",
                  <>
                    The shaded area between touchdown and stop is the ground
                    roll, coloured by runway surface: dry grass{" "}
                    <Chip
                      size="small"
                      sx={{ bgcolor: LANDING_SURFACE_COLOURS.dryGrass, width: 24 }}
                    />
                    , wet grass{" "}
                    <Chip
                      size="small"
                      sx={{ bgcolor: LANDING_SURFACE_COLOURS.wetGrass, width: 24 }}
                    />
                    , dry tarmac{" "}
                    <Chip
                      size="small"
                      sx={{ bgcolor: LANDING_SURFACE_COLOURS.dryTarmac, width: 24 }}
                    />{" "}
                    and wet tarmac{" "}
                    <Chip
                      size="small"
                      sx={{ bgcolor: LANDING_SURFACE_COLOURS.wetTarmac, width: 24 }}
                    />
                    .
                  </>,
                  "Each line is 60m wide, 30m either side of the runway centreline.",
                ]}
              />
              <Typography variant="h6">Settings → Landing Area</Typography>
              <BulletList
                items={[
                  <>
                    <strong>Show landing area on map:</strong> on by default.
                    Untick it if your landing area is not in line with the
                    launch point, for example further into the field. The
                    distances in the settings panel are still shown.
                  </>,
                  <>
                    <strong>Runway surface:</strong> Grass or Tarmac, and Dry
                    or Wet.
                  </>,
                  <>
                    <strong>Safety Factor - Pilot Ability:</strong>{" "}
                    {LANDING_SAFETY_FACTORS.map(
                      ({ value, label }) =>
                        `${label} ×${value.toFixed(1)}${value === DEFAULT_LANDING_SAFETY_FACTOR ? " (default)" : ""}`,
                    ).join(", ")}
                    . Every distance is multiplied by this factor.
                  </>,
                  "The diagram shows the headwind component, ground roll distance, reference point distance and approach speed, laid out like the map.",
                ]}
              />
              <Typography variant="h6">How it is calculated</Typography>
              <BulletList
                items={[
                  "Headwind component: the surface wind along the runway, from the launch point towards the winch. A negative value is a tailwind.",
                  "Approach speed: 50kts plus half the headwind component, and never below 55kts.",
                  "The model works out the float from the aim point to touchdown, then the ground roll to a stop with full airbrake and wheel brake, for an ASK 21 at its maximum weight (600kg). In stronger winds part of the extra approach speed is carried through to touchdown.",
                ]}
              />
              <Alert severity="warning">
                These are engineering estimates, not flight manual data. Use
                them as a guide alongside local knowledge and your instructors'
                advice.
              </Alert>
            </Stack>
            <Stack spacing={1} sx={{ flex: 1, width: "100%", maxWidth: 380 }}>
              <LandingAreaDiagram
                headwindKt={EXAMPLE_HEADWIND_KT}
                approachKt={exampleLanding.approachAirspeedKt}
                groundRollM={exampleLanding.groundRollM}
                referencePointM={exampleLanding.aimPointToStopM}
                surface="dryGrass"
              />
              <Typography variant="caption" color="text.secondary" align="center">
                Example: {EXAMPLE_HEADWIND_KT}kt headwind on dry grass, default
                pilot ability
              </Typography>
            </Stack>
          </Box>
        </AccordionDetails>
      </Accordion>

      <Alert severity="info">
        If you need additional assistance or have questions not covered in this
        help section, please contact LukeDale90@gmail.com
      </Alert>
    </PageLayout>
  );
};

export default HelpPage;
