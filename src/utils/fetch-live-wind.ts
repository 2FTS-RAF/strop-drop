import { fetchWeatherApi } from "openmeteo";

const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";
const REQUEST_TIMEOUT_MS = 15000;

export const LIVE_WIND_POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export interface LiveWind {
  surfaceWind: { speed: number; direction: number };
  twoThousandFtWind: { speed: number; direction: number };
}

// Round to whole degrees; 0° is reported as 360° to match the direction sliders (5–360)
const normaliseDirection = (direction: number): number => {
  const rounded = Math.round(direction) % 360;
  return rounded === 0 ? 360 : rounded;
};

export const fetchLiveWind = async (location: {
  lat: number;
  lng: number;
}): Promise<LiveWind> => {
  // Variable order matters: the response is read back by index below.
  // 600m is the closest UKMO height level to 2000ft (heights are above sea level).
  const params = {
    latitude: location.lat,
    longitude: location.lng,
    hourly: [
      "wind_speed_10m",
      "wind_direction_10m",
      "wind_speed_600m",
      "wind_direction_600m",
    ],
    models: "ukmo_seamless",
    current: ["wind_speed_10m", "wind_direction_10m"],
    forecast_days: 1,
    wind_speed_unit: "kn",
  };

  const [response] = await fetchWeatherApi(OPEN_METEO_URL, params, 3, 0.2, 2, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  const current = response?.current();
  const hourly = response?.hourly();

  const surfaceSpeed = current?.variables(0)?.value();
  const surfaceDirection = current?.variables(1)?.value();

  // Height levels are hourly only, so take the slot for the current hour
  const twoKSpeeds = hourly?.variables(2)?.valuesArray();
  const twoKDirections = hourly?.variables(3)?.valuesArray();
  let twoKSpeed: number | undefined;
  let twoKDirection: number | undefined;

  if (hourly && twoKSpeeds && twoKDirections && twoKSpeeds.length > 0) {
    const elapsed = Date.now() / 1000 - Number(hourly.time());
    const index = Math.min(
      Math.max(Math.floor(elapsed / hourly.interval()), 0),
      twoKSpeeds.length - 1,
    );
    twoKSpeed = twoKSpeeds[index];
    twoKDirection = twoKDirections[index];
  }

  const values = [surfaceSpeed, surfaceDirection, twoKSpeed, twoKDirection];
  if (!values.every((value) => Number.isFinite(value))) {
    throw new Error("Live wind data unavailable for this location");
  }

  return {
    surfaceWind: {
      speed: Math.round(surfaceSpeed!),
      direction: normaliseDirection(surfaceDirection!),
    },
    twoThousandFtWind: {
      speed: Math.round(twoKSpeed!),
      direction: normaliseDirection(twoKDirection!),
    },
  };
};
