import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { LiveWindContext } from "./LiveWindContext";
import { useParameters } from "./ParametersContext";
import {
  calculateDistance,
  fetchLiveWind,
  LIVE_WIND_POLL_INTERVAL_MS,
} from "../utils";

const REFETCH_DISTANCE_M = 5000; // refetch if the launch point moves more than 5km

export interface LiveWindProviderProps {
  children: ReactNode;
}

export interface LiveWindContextType {
  isLoading: boolean;
  lastUpdated: Date | null;
  error: string | null;
  dismissError: () => void;
}

type LatLng = { lat: number; lng: number };

export const LiveWindProvider: React.FC<LiveWindProviderProps> = ({
  children,
}) => {
  const { parameters, setParameters } = useParameters();
  const isLive = parameters.windSource === "live";

  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Bumped to force an immediate refetch and restart the poll timer
  const [refetchKey, setRefetchKey] = useState(0);

  const launchPointRef = useRef<LatLng>(parameters.launchPoint);
  const lastFetchedPointRef = useRef<LatLng | null>(null);
  // Responses from superseded requests are ignored
  const requestIdRef = useRef(0);

  useEffect(() => {
    launchPointRef.current = parameters.launchPoint;
  }, [parameters.launchPoint]);

  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    const location = launchPointRef.current;
    lastFetchedPointRef.current = location;
    setIsLoading(true);

    try {
      const { surfaceWind, twoThousandFtWind } = await fetchLiveWind(location);
      if (requestId !== requestIdRef.current) return;

      setParameters((prev) =>
        prev.windSource === "live"
          ? { ...prev, surfaceWind, twoThousandFtWind }
          : prev,
      );
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;

      console.error("Error fetching live wind:", err);
      const reason =
        err instanceof Error && err.name === "TimeoutError"
          ? "The weather service did not respond"
          : err instanceof Error
            ? err.message
            : "Unknown error";
      setError(reason);
      setParameters((prev) => ({ ...prev, windSource: "manual" }));
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [setParameters]);

  // Fetch immediately in live mode, then poll
  useEffect(() => {
    if (!isLive) {
      requestIdRef.current++;
      lastFetchedPointRef.current = null;
      setIsLoading(false);
      return;
    }

    refresh();
    const timer = setInterval(refresh, LIVE_WIND_POLL_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [isLive, refetchKey, refresh]);

  // Refetch when the launch point moves far enough from where the wind was last fetched
  useEffect(() => {
    if (!isLive || !lastFetchedPointRef.current) return;

    const distance = calculateDistance(
      lastFetchedPointRef.current,
      parameters.launchPoint,
    );

    if (distance > REFETCH_DISTANCE_M) {
      setRefetchKey((key) => key + 1);
    }
  }, [parameters.launchPoint, isLive]);

  const dismissError = useCallback(() => setError(null), []);

  return (
    <LiveWindContext.Provider
      value={{ isLoading, lastUpdated, error, dismissError }}>
      {children}
    </LiveWindContext.Provider>
  );
};
