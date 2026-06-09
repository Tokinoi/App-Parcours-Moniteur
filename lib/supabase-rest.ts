import { supabase } from "@/lib/supabase";
import type { Poi } from "@/lib/types";

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
