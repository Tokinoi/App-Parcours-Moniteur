import type { Parcours, Poi } from "@/lib/types";

// ── Lyon POIs ──────────────────────────────────────────────────────────────
export const samplePois: Poi[] = [
  {
    id: "poi-bellecour",
    name: "Place Bellecour",
    description: "Grande place piétonne au cœur de Lyon, point de repère majeur.",
    latitude: 45.7579,
    longitude: 4.8320,
    category: "Repère",
    status: "active",
  },
  {
    id: "poi-carnot",
    name: "Place Carnot",
    description: "Carrefour animé près de la gare de Perrache, tramways et bus.",
    latitude: 45.7529,
    longitude: 4.8297,
    category: "Intersection",
    status: "active",
  },
  {
    id: "poi-guillotiere",
    name: "Pont de la Guillotière",
    description: "Pont sur le Rhône, voie prioritaire à gérer en sortie de pont.",
    latitude: 45.7568,
    longitude: 4.8376,
    category: "Voie prioritaire",
    status: "active",
  },
  {
    id: "poi-gabriel-peri",
    name: "Rond-point Gabriel Péri",
    description: "Rond-point dense dans le 7ème arrondissement, fort trafic.",
    latitude: 45.7477,
    longitude: 4.8252,
    category: "Rond-point",
    status: "active",
  },
  {
    id: "poi-quai-saone",
    name: "Quai de Saône – Pont Tilsit",
    description: "Voie rapide le long de la Saône, priorités et entrées de pont.",
    latitude: 45.7678,
    longitude: 4.8267,
    category: "Voie rapide",
    status: "active",
  },
  {
    id: "poi-terreaux",
    name: "Place des Terreaux",
    description: "Carrefour historique avec tramways, priorités complexes et piétons.",
    latitude: 45.7678,
    longitude: 4.8342,
    category: "Intersection",
    status: "active",
  },
  {
    id: "poi-republique",
    name: "Rue de la République",
    description: "Voie semi-piétonne en sens unique, croisements à gérer avec soin.",
    latitude: 45.7647,
    longitude: 4.8338,
    category: "Sens unique",
    status: "active",
  },
  {
    id: "poi-part-dieu",
    name: "Gare de la Part-Dieu",
    description: "Zone intense : taxis, bus, piétons, flux dense à toute heure.",
    latitude: 45.7605,
    longitude: 4.8590,
    category: "Zone dense",
    status: "active",
  },
  {
    id: "poi-vitton",
    name: "Cours Vitton",
    description: "Avenue commerçante, créneaux de livraison et stationnement urbain.",
    latitude: 45.7648,
    longitude: 4.8530,
    category: "Stationnement",
    status: "active",
  },
  {
    id: "poi-saxe-gambetta",
    name: "Carrefour Saxe-Gambetta",
    description: "Grand carrefour à feux, voies réservées et pistes cyclables.",
    latitude: 45.7521,
    longitude: 4.8439,
    category: "Carrefour à feux",
    status: "active",
  },
  {
    id: "poi-gerland",
    name: "Rond-point de Gerland",
    description: "Rond-point multi-voies en zone industrielle, attention aux poids-lourds.",
    latitude: 45.7283,
    longitude: 4.8258,
    category: "Rond-point",
    status: "active",
  },
  {
    id: "poi-mermoz",
    name: "Rond-point Mermoz",
    description: "Rond-point de quartier résidentiel, bonne introduction aux ronds-points.",
    latitude: 45.7370,
    longitude: 4.8697,
    category: "Rond-point",
    status: "active",
  },
];

// ── Sample parcours ────────────────────────────────────────────────────────

const poiById = (id: string) => {
  const poi = samplePois.find((p) => p.id === id);
  if (!poi) throw new Error(`Unknown POI id: ${id}`);
  return poi;
};

export const sampleParcours: Parcours[] = [
  {
    id: "parcours-rondpoints",
    name: "Ronds-points lyonnais",
    description:
      "Maîtrisez les ronds-points en conditions réelles à travers 4 points clés du sud de Lyon.",
    skill: "Ronds-points",
    durationMinutes: 30,
    steps: [
      {
        poi: poiById("poi-carnot"),
        orderIndex: 0,
        instruction:
          "Départ Place Carnot. Observez la signalisation et préparez-vous à rejoindre le premier rond-point.",
      },
      {
        poi: poiById("poi-gabriel-peri"),
        orderIndex: 1,
        instruction:
          "Rond-point Gabriel Péri : cédez le passage aux véhicules déjà engagés. Choisissez votre file à l'avance.",
      },
      {
        poi: poiById("poi-gerland"),
        orderIndex: 2,
        instruction:
          "Rond-point de Gerland : voies multiples et poids-lourds. Maintenez vos distances et signalez vos sorties.",
      },
      {
        poi: poiById("poi-bellecour"),
        orderIndex: 3,
        instruction:
          "Arrivée Place Bellecour. Debriefez avec votre moniteur sur les ronds-points traversés.",
      },
    ],
  },
  {
    id: "parcours-priorites",
    name: "Priorités & intersections",
    description:
      "Apprenez à gérer la priorité à droite, les voies prioritaires et les carrefours complexes du centre de Lyon.",
    skill: "Priorités à droite",
    durationMinutes: 30,
    steps: [
      {
        poi: poiById("poi-quai-saone"),
        orderIndex: 0,
        instruction:
          "Départ quai de Saône. Prenez conscience de la route prioritaire, veillez à bien céder aux véhicules venant de droite aux intersections non signalées.",
      },
      {
        poi: poiById("poi-terreaux"),
        orderIndex: 1,
        instruction:
          "Place des Terreaux : tramways, voies piétonnes et carrefour multi-directions. Anticipez les mouvements.",
      },
      {
        poi: poiById("poi-republique"),
        orderIndex: 2,
        instruction:
          "Rue de la République : voie à sens unique. Vérifiez votre positionnement et anticipez les sorties.",
      },
      {
        poi: poiById("poi-bellecour"),
        orderIndex: 3,
        instruction:
          "Retour Bellecour : traversée de la grande place. Observez les passages piétons et les flux vélos.",
      },
    ],
  },
  {
    id: "parcours-centre-ville",
    name: "Conduite en centre-ville",
    description:
      "Itinéraire pratique dans les zones les plus denses de Lyon : gares, avenues commerçantes et carrefours à feux.",
    skill: "Conduite urbaine",
    durationMinutes: 30,
    steps: [
      {
        poi: poiById("poi-part-dieu"),
        orderIndex: 0,
        instruction:
          "Départ gare Part-Dieu : zone à fort trafic. Respectez les voies bus/taxis et anticipez les piétons.",
      },
      {
        poi: poiById("poi-vitton"),
        orderIndex: 1,
        instruction:
          "Cours Vitton : créneau de livraison en double file, ouverture de portières. Maintenez vos distances latérales.",
      },
      {
        poi: poiById("poi-saxe-gambetta"),
        orderIndex: 2,
        instruction:
          "Carrefour Saxe-Gambetta : phase de feux et voies réservées aux bus. Ne jamais empiéter sur la piste cyclable.",
      },
      {
        poi: poiById("poi-guillotiere"),
        orderIndex: 3,
        instruction:
          "Pont de la Guillotière : franchissement du pont avec voie prioritaire en sortie. Fin du parcours.",
      },
    ],
  },
];
