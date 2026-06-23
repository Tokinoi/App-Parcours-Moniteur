export type LatLon = { latitude: number; longitude: number };

// Haversine distance between two coordinates in metres
export function haversineDistance(a: LatLon, b: LatLon): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const x =
    sinLat * sinLat +
    sinLon * sinLon * Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude));
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function formatDistance(metres: number): string {
  if (metres < 50) return "Vous y êtes !";
  if (metres < 1000) return `${Math.round(metres / 10) * 10} m`;
  return `${(metres / 1000).toFixed(1)} km`;
}

// Fetch a road-following route from OSRM (public instance, no key needed).
// Returns straight-line fallback on any error.
export async function fetchRoadRoute(waypoints: LatLon[]): Promise<LatLon[]> {
  if (waypoints.length < 2) return waypoints;

  // OSRM expects lon,lat order (NOT lat,lon)
  const coords = waypoints.map((p) => `${p.longitude},${p.latitude}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;

  // AbortSignal.timeout is not available in React Native — use a manual controller.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) return waypoints;

    const json = (await res.json()) as {
      code: string;
      routes?: Array<{
        geometry: { coordinates: [number, number][] };
      }>;
    };

    if (json.code !== "Ok" || !json.routes?.[0]) return waypoints;

    return json.routes[0].geometry.coordinates.map(([lon, lat]) => ({
      latitude: lat,
      longitude: lon,
    }));
  } catch {
    clearTimeout(timer);
    return waypoints;
  }
}
