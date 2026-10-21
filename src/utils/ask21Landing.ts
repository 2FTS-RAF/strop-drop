/**
 * ASK 21 landing performance estimate — maximum all-up mass (600 kg),
 * full airbrake with the wheel brake fully applied.
 *
 * Returns:
 *  - groundRollM:      touchdown → full stop
 *  - floatM:           aim point → touchdown (round-out and hold-off)
 *  - aimPointToStopM:  aim point → full stop (floatM + groundRollM)
 *
 * The model integrates the motion numerically in small time steps. Aerodynamic
 * forces use AIRSPEED and distance covered uses GROUNDSPEED, so the headwind is
 * handled properly in both the float and the ground roll.
 *
 * These are engineering estimates from first principles, not flight-manual data.
 */

export type RunwaySurface = "dryGrass" | "wetGrass" | "dryTarmac" | "wetTarmac";

export interface LandingResult {
  approachAirspeedKt: number;
  approachGroundspeedKt: number;
  touchdownAirspeedKt: number;
  touchdownGroundspeedKt: number;
  floatM: number;
  groundRollM: number;
  aimPointToStopM: number;
  /** aimPointToStopM multiplied by the safety factor, if one was given */
  factoredAimPointToStopM: number;
}

// ---------- Constants (adjust to suit your club's figures) ----------

const G = 9.81;
const KT = 0.514444; // m/s per knot

/** Normal approach speed in light winds, and the minimum approach speed */
const NORMAL_APPROACH_KT = 55;
/** Approach speed = 50 kt + half the headwind, never below NORMAL_APPROACH_KT */
const APPROACH_BASE_KT = 50;
const APPROACH_HEADWIND_SHARE = 0.5;

/** Touchdown airspeed at the normal approach speed: about 1.1 × stall at 600 kg ≈ 70 km/h */
const TOUCHDOWN_KT = 70 / 1.852;

/**
 * CALIBRATION: share of the approach-speed increase (above NORMAL_APPROACH_KT) still
 * carried at touchdown. In strong, gusty winds the glider is flown onto the ground
 * rather than held off to minimum speed, so it touches down faster and the ground roll
 * stays realistic. 0.75 gives about 22 m on dry grass in a 30 kt headwind (observed 20–30 m).
 */
const TOUCHDOWN_SPEED_RETAINED = 0.75;

/**
 * CALIBRATION: distance from the aim point to touchdown (the flare and hold-off)
 * at the normal approach speed in nil wind. Set this from your own observations.
 * Every other float distance is scaled from it physically, so changing it moves all results consistently.
 */
const FLOAT_NIL_WIND_M = 60;

/** Reference speed (90 km/h) for the ground-roll airbrake drag below */
const V_REF = (90 / 1.852) * KT;
/** Drag/weight with full airbrake at V_REF, used in the ground roll */
const DW_PARASITE = 0.10;

/** Fraction of the weight still carried by the wing at touchdown, in ground attitude */
const LIFT_FRACTION_AT_TD = 0.6;
/** Share of the weight on the braked main wheel while braking (the rest is on the nose and tail wheels) */
const MAIN_WHEEL_SHARE = 0.75;
/** Maximum friction coefficient the ASK 21 drum brake can generate (torque limit) */
const BRAKE_CAPABILITY_MU = 0.35;

/** Tyre/surface friction: braked wheel and free-rolling wheels */
const SURFACE: Record<RunwaySurface, { brakeMu: number; rollMu: number }> = {
  dryGrass:  { brakeMu: 0.30, rollMu: 0.05 },
  wetGrass:  { brakeMu: 0.18, rollMu: 0.06 },
  dryTarmac: { brakeMu: 0.70, rollMu: 0.02 }, // limited by brake capability
  wetTarmac: { brakeMu: 0.45, rollMu: 0.02 }, // limited by brake capability
};

const DT = 0.01; // integration time step, seconds

// ---------- Model ----------

/**
 * Float model. Full-airbrake drag scales with V², so the deceleration is dv/dt = -v²/C.
 * In still air that gives float = C · ln(V_approach / V_touchdown): extra approach speed
 * adds distance only logarithmically, which matches the experience that 5 kt extra
 * costs relatively little. C is set so the nil-wind float equals FLOAT_NIL_WIND_M.
 * The model measures from the aim point. Round-out starts slightly before it, and the
 * calibration absorbs that.
 */
const FLOAT_C = FLOAT_NIL_WIND_M / Math.log(NORMAL_APPROACH_KT / TOUCHDOWN_KT);

/**
 * @param headwindKt  headwind component in knots (negative = tailwind)
 * @param surface     runway surface and condition
 * @param safetyFactor optional multiplier for factoredAimPointToStopM (default 1)
 */
export function ask21LandingDistance(
  headwindKt: number,
  surface: RunwaySurface,
  safetyFactor = 1,
): LandingResult {
  const wind = headwindKt * KT;
  const approachKt =
    Math.round(
      Math.max(
        NORMAL_APPROACH_KT,
        APPROACH_BASE_KT + APPROACH_HEADWIND_SHARE * headwindKt,
      ) * 10,
    ) / 10;
  const touchdownKt =
    TOUCHDOWN_KT + TOUCHDOWN_SPEED_RETAINED * (approachKt - NORMAL_APPROACH_KT);
  const vApp = approachKt * KT;
  const vTd = touchdownKt * KT;
  // The wing's lift on the ground depends on airspeed, so it is scaled from the normal touchdown speed
  const vTdNormal = TOUCHDOWN_KT * KT;

  // --- Float: aim point → touchdown. Decelerate from approach to touchdown airspeed. ---
  let va = vApp;
  let floatM = 0;
  while (va > vTd) {
    const decel = (va * va) / FLOAT_C;
    floatM += (va - wind) * DT; // groundspeed × time
    va -= decel * DT;
  }

  // --- Ground roll: touchdown → stop ---
  const { brakeMu, rollMu } = SURFACE[surface];
  const muBrake = Math.min(brakeMu, BRAKE_CAPABILITY_MU);
  const muEff = MAIN_WHEEL_SHARE * muBrake + (1 - MAIN_WHEEL_SHARE) * rollMu;

  let vg = vTd - wind; // groundspeed
  let groundRollM = 0;
  // A tailwind that exceeds the airspeed is outside the model's limits; the loop still terminates.
  while (vg > 0) {
    const vaGround = Math.max(vg + wind, 0);
    const q = (vaGround / vTdNormal) ** 2; // dynamic pressure relative to normal touchdown
    const liftFrac = Math.min(LIFT_FRACTION_AT_TD * q, 1);
    // On the ground the lift is low, so induced drag is small: use the parasite and airbrake part only.
    const dragFrac = DW_PARASITE * (vaGround / V_REF) ** 2;
    const decel = G * (muEff * (1 - liftFrac) + dragFrac);
    groundRollM += vg * DT;
    vg -= decel * DT;
  }

  const aimPointToStopM = floatM + groundRollM;
  const round = (x: number) => Math.round(x * 10) / 10;

  return {
    approachAirspeedKt: round(approachKt),
    approachGroundspeedKt: round(approachKt - headwindKt),
    touchdownAirspeedKt: round(touchdownKt),
    touchdownGroundspeedKt: round(touchdownKt - headwindKt),
    floatM: round(floatM),
    groundRollM: round(groundRollM),
    aimPointToStopM: round(aimPointToStopM),
    factoredAimPointToStopM: round(aimPointToStopM * safetyFactor),
  };
}