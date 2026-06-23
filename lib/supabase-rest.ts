import { supabase } from "@/lib/supabase";
import { sampleParcours } from "@/lib/sample-data";
import type { Parcours, ParcoursStep, Poi } from "@/lib/types";

type PoiRow = {
  id: string;
  name: string;
  description: string | null;
  type: string | null;
  status: string | null;
  latitude: number | string;
  longitude: number | string;
};

function mapPoi(row: PoiRow): Poi {
  return {
    id: row.id,
    name: row.name,
    description: row.description || "",
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    category: row.type || "repere",
    status: row.status || "active",
  };
}

export async function fetchActivePois() {
  const { data, error } = await supabase
    .from("pois")
    .select("id, name, description, type, status, latitude, longitude")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as PoiRow[]).map(mapPoi);
}

export async function fetchAllPois() {
  const { data, error } = await supabase
    .from("pois")
    .select("id, name, description, type, status, latitude, longitude")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as PoiRow[]).map(mapPoi);
}

export async function createVadrouillePoi(input: {
  name: string;
  latitude: number;
  longitude: number;
}) {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id ?? null;

  const { data, error } = await supabase
    .from("pois")
    .insert({
      name: input.name,
      description: "Créé en mode vadrouille",
      type: "vadrouille",
      status: "en cours",
      latitude: input.latitude,
      longitude: input.longitude,
      created_by: userId,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapPoi(data as PoiRow);
}

type ParcoursRow = {
  id: string;
  name: string;
  description: string | null;
  skill: string;
  duration_minutes: number;
  parcours_pois: Array<{
    order_index: number;
    instruction: string | null;
    // Supabase type inference wraps FK-joined rows in an array even for single rows
    pois: PoiRow | PoiRow[];
  }>;
};

export async function fetchParcours(): Promise<Parcours[]> {
  const { data, error } = await supabase
    .from("parcours")
    .select(
      `id, name, description, skill, duration_minutes,
       parcours_pois(order_index, instruction, pois(id, name, description, type, status, latitude, longitude))`,
    )
    .order("created_at", { ascending: true });

  if (error) {
    // Fall back to offline sample data when Supabase parcours tables aren't set up yet.
    return sampleParcours;
  }
  if (!data || data.length === 0) return sampleParcours;

  return (data as unknown as ParcoursRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    skill: row.skill,
    durationMinutes: row.duration_minutes,
    steps: row.parcours_pois
      .sort((a, b) => a.order_index - b.order_index)
      .map((pp): ParcoursStep => {
        const poiData = Array.isArray(pp.pois) ? pp.pois[0] : pp.pois;
        return {
          poi: mapPoi(poiData),
          orderIndex: pp.order_index,
          instruction: pp.instruction ?? "",
        };
      }),
  }));
}

export async function fetchFavoritePois(input: { userId: string }) {
  const { data: favData, error: favError } = await supabase
    .from("favorites")
    .select("poi_id")
    .eq("user_id", input.userId)
    .order("created_at", { ascending: false });

  if (favError) throw new Error(favError.message);
  if (!favData.length) return [];

  const poiIds = favData.map((f) => f.poi_id).filter(Boolean) as string[];

  const { data: poisData, error: poisError } = await supabase
    .from("pois")
    .select("id, name, description, type, status, latitude, longitude")
    .in("id", poiIds);

  if (poisError) throw new Error(poisError.message);

  const byId = new Map((poisData as PoiRow[]).map((p) => [p.id, mapPoi(p)]));
  return poiIds.map((id) => byId.get(id)).filter((p): p is Poi => Boolean(p));
}

export async function fetchFavoriteIds(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("favorites")
    .select("poi_id")
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  return new Set((data ?? []).map((f) => f.poi_id).filter(Boolean) as string[]);
}

export async function addFavorite(userId: string, poiId: string) {
  const { error } = await supabase
    .from("favorites")
    .insert({ user_id: userId, poi_id: poiId });

  if (error) throw new Error(error.message);
}

export async function removeFavorite(userId: string, poiId: string) {
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("poi_id", poiId);

  if (error) throw new Error(error.message);
}
