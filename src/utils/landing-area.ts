import { ask21LandingDistance, type RunwaySurface } from "./ask21Landing";
import { calculateDriftCoordinates } from "./calculate-drift-coordinates";

type Point = { lat: number; lng: number };

/** Landing distances with the safety factor applied to every part */
export interface LandingDistances {
  approachAirspeedKt: number;
  floatM: number;
  groundRollM: number;
  aimPointToStopM: number;
  /** Extra distance the safety factor adds, already included above */
  safetyMarginM: number;
}

/** Safety factor applied to every landing distance, by pilot experience */
export const LANDING_SAFETY_FACTORS = [
  { value: 1.0, label: "Experienced" },
  { value: 1.2, label: "Competent" },
  { value: 1.4, label: "Novice" },
] as const;

/** Competent pilots by default; follows the Competent value above */
export const DEFAULT_LANDING_SAFETY_FACTOR = LANDING_SAFETY_FACTORS.find(
  ({ label }) => label === "Competent",
)!.value;

/** Line colours, shared by the map, the map key and the settings read-out */
export const LANDING_LINE_COLOURS = {
  aim: "magenta",
  touchdown: "yellow",
  stop: "white",
} as const;

export interface LandingArea {
  aimLine: [Point, Point];
  touchdownLine: [Point, Point];
  stopLine: [Point, Point];
  /** Touchdown → stop: the ground the glider is in contact with */
  groundRollArea: Point[];
}

/** Shading for the ground-roll area, by runway surface */
export const LANDING_SURFACE_COLOURS: Record<RunwaySurface, string> = {
  dryGrass: "#8a7f2e", // browny green
  wetGrass: "#2a9d8f", // bluey green
  dryTarmac: "#9e9e9e", // grey
  wetTarmac: "#5c7a99", // bluey grey
};

// The model can go negative in very strong headwinds; clamp each part so the
// aim line never ends up in front of the touchdown line or the launch point.
// The safety factor scales the float and the ground roll alike, so every line moves back.
export const getLandingDistances = (
  headwindKt: number,
  surface: RunwaySurface,
  safetyFactor = 1,
): LandingDistances => {
  const { approachAirspeedKt, floatM, groundRollM } = ask21LandingDistance(
    headwindKt,
    surface,
  );
  const clampedFloat = Math.max(0, floatM);
  const clampedGroundRoll = Math.max(0, groundRollM);
  const unfactoredTotal = clampedFloat + clampedGroundRoll;
  const round = (x: number) => Math.round(x * 10) / 10;

  return {
    approachAirspeedKt,
    floatM: round(clampedFloat * safetyFactor),
    groundRollM: round(clampedGroundRoll * safetyFactor),
    aimPointToStopM: round(unfactoredTotal * safetyFactor),
    safetyMarginM: round(unfactoredTotal * (safetyFactor - 1)),
  };
};

const offset = (point: Point, bearingDeg: number, distanceM: number): Point => {
  const bearing = (bearingDeg * Math.PI) / 180;
  return calculateDriftCoordinates(
    point.lat,
    point.lng,
    distanceM * Math.sin(bearing), // east
    distanceM * Math.cos(bearing), // north
  );
};

/**
 * Landing lines behind the launch point. Gliders land in the launch direction
 * and stop at the launch point, so the launch point is the datum: the stop line
 * goes through it and the touchdown and aim lines sit behind it, away from the winch.
 */
export const calculateLandingArea = (
  launchPoint: Point,
  runwayHeading: number,
  { groundRollM, aimPointToStopM }: LandingDistances,
  halfWidthM = 30,
): LandingArea => {
  const behind = runwayHeading + 180;

  // Perpendicular to the runway, halfWidthM either side of the centreline
  const lineAt = (distanceBehindM: number): [Point, Point] => {
    const centre = offset(launchPoint, behind, distanceBehindM);
    return [
      offset(centre, runwayHeading - 90, halfWidthM),
      offset(centre, runwayHeading + 90, halfWidthM),
    ];
  };

  const aimLine = lineAt(aimPointToStopM);
  const touchdownLine = lineAt(groundRollM);
  const stopLine = lineAt(0);

  return {
    aimLine,
    touchdownLine,
    stopLine,
    groundRollArea: [
      touchdownLine[0],
      touchdownLine[1],
      stopLine[1],
      stopLine[0],
    ],
  };
};
