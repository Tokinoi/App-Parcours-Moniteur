import type { Poi } from "@/lib/types";

export const samplePois: Poi[] = [
  {
    id: "poi-concorde",
    name: "Place de la Concorde",
    description: "Point de repère large et lisible pour démarrer le parcours.",
    latitude: 48.865633,
    longitude: 2.321236,
    category: "Patrimoine",
    status: "Disponible",
  },
  {
    id: "poi-seine",
    name: "Quai de Seine",
    description: "Zone agréable pour poser un POI de pause ou de passage.",
    latitude: 48.86082,
    longitude: 2.33277,
    category: "Balade",
    status: "Nouveau",
  },
  {
    id: "poi-louvre",
    name: "Cour du Louvre",
    description: "Emplacement central pour tester le mode vadrouille.",
    latitude: 48.860611,
    longitude: 2.337644,
    category: "Culture",
    status: "Signalé",
  },
];
