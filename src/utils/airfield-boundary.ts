import type { LocationOption } from "./available-sites";

type Point = { lat: number; lng: number };

// Planar test using lng as x and lat as y. Intersection is unaffected by axis
// scaling, so no map projection is needed.
const orientation = (a: Point, b: Point, c: Point): number => {
  const value =
    (b.lat - a.lat) * (c.lng - b.lng) - (b.lng - a.lng) * (c.lat - b.lat);
  if (value === 0) return 0;
  return value > 0 ? 1 : 2;
};

// Assumes a, b, c are collinear: is b within the bounding box of a–c?
const onSegment = (a: Point, b: Point, c: Point): boolean =>
  b.lng <= Math.max(a.lng, c.lng) &&
  b.lng >= Math.min(a.lng, c.lng) &&
  b.lat <= Math.max(a.lat, c.lat) &&
  b.lat >= Math.min(a.lat, c.lat);

// Inclusive: touching, shared endpoints and collinear overlap all count
export const segmentsIntersect = (
  p1: Point,
  p2: Point,
  q1: Point,
  q2: Point,
): boolean => {
  const o1 = orientation(p1, p2, q1);
  const o2 = orientation(p1, p2, q2);
  const o3 = orientation(q1, q2, p1);
  const o4 = orientation(q1, q2, p2);

  if (o1 !== o2 && o3 !== o4) return true;

  return (
    (o1 === 0 && onSegment(p1, q1, p2)) ||
    (o2 === 0 && onSegment(p1, q2, p2)) ||
    (o3 === 0 && onSegment(q1, p1, q2)) ||
    (o4 === 0 && onSegment(q1, p2, q2))
  );
};

const edges = (polygon: Point[]): [Point, Point][] =>
  polygon.map((point, i) => [point, polygon[(i + 1) % polygon.length]]);

// True if any edge of the area touches or crosses any edge of the closed boundary
export const polygonCrossesBoundary = (
  area: Point[],
  boundary: Point[],
): boolean => {
  if (area.length < 3 || boundary.length < 3) return false;

  const boundaryEdges = edges(boundary);
  return edges(area).some(([a1, a2]) =>
    boundaryEdges.some(([b1, b2]) => segmentsIntersect(a1, a2, b1, b2)),
  );
};

// Names of the sites whose boundary line the area crosses
export const findCrossedBoundaries = (
  area: Point[],
  sites: LocationOption[],
): string[] =>
  sites
    .filter(
      (site) =>
        site.boundary &&
        polygonCrossesBoundary(
          area,
          site.boundary.map(([lat, lng]) => ({ lat, lng })),
        ),
    )
    .map((site) => site.name);
