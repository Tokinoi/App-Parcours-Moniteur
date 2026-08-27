import { haversineDistance, type LatLon } from "@/lib/routing";
import type {
  Parcours,
  ParcoursStep,
  Poi,
  TrainingFocus,
  TrainingGenerationInput,
  TrainingPreset,
} from "@/lib/types";

const FOCUS_CONFIG: Record<
  TrainingFocus,
  {
    keywords: string[];
    exerciseTypes: string[];
    intro: string;
    strictMatch?: boolean;
  }
> = {
  Giratoires: {
    keywords: ["rond point", "rond-point", "giratoire", "bretelle"],
    exerciseTypes: [
      "Prise d'information",
      "Placement de voie",
      "Cédez le passage",
    ],
    intro: "Travaillez la lecture des priorités et les sorties de giratoire.",
    strictMatch: true,
  },
  "Priorités à droite": {
    keywords: ["priorite", "priorité", "carrefour", "intersection", "stop"],
    exerciseTypes: ["Priorité à droite", "Observation", "Anticipation"],
    intro:
      "Enchaînez les intersections pour gérer les priorités sans hésitation.",
  },
  "Conduite urbaine": {
    keywords: ["centre", "zone dense", "urbain", "piéton", "bus", "tram"],
    exerciseTypes: [
      "Gestion de flux",
      "Conscience des usagers",
      "Positionnement",
    ],
    intro:
      "Travaillez les flux urbains, les piétons et les croisements serrés.",
  },
  "Carrefours à feux": {
    keywords: ["feux", "carrefour", "intersection", "voie", "traversée"],
    exerciseTypes: [
      "Démarrage au feu",
      "Anticipation",
      "Lecture de signalisation",
    ],
    intro:
      "Enchaînez les feux et les carrefours pour sécuriser vos phases d'approche.",
  },
  Stationnement: {
    keywords: ["stationnement", "livraison", "parking", "arrêt", "bordure"],
    exerciseTypes: ["Arrêt sécurisé", "Contrôle des angles morts", "Manoeuvre"],
    intro: "Variez les arrêts et les manoeuvres de bord de chaussée.",
  },
  Mixte: {
    keywords: ["rond", "carrefour", "zone", "feux", "priorité", "urbain"],
    exerciseTypes: ["Adaptation", "Anticipation", "Lecture globale"],
    intro: "Alternez les situations pour une session polyvalente.",
  },
};

const SHARED_PRESETS: TrainingPreset[] = [
  {
    id: "shared-giratoires-20",
    name: "Giratoires express",
    description:
      "Une boucle courte pour réviser les entrées, les voies et les sorties.",
    focus: "Giratoires",
    durationMinutes: 20,
    exerciseTypes: [
      "Prise d'information",
      "Placement de voie",
      "Cédez le passage",
    ],
    shareable: true,
  },
  {
    id: "shared-priorites-30",
    name: "Priorités & intersections",
    description:
      "Un format intermédiaire centré sur les priorités et les carrefours urbains.",
    focus: "Priorités à droite",
    durationMinutes: 30,
    exerciseTypes: ["Priorité à droite", "Observation", "Anticipation"],
    shareable: true,
  },
  {
    id: "shared-urbain-30",
    name: "Centre-ville dense",
    description:
      "Idéal pour travailler le trafic urbain et les interactions avec les autres usagers.",
    focus: "Conduite urbaine",
    durationMinutes: 30,
    exerciseTypes: [
      "Gestion de flux",
      "Conscience des usagers",
      "Positionnement",
    ],
    shareable: true,
  },
  {
    id: "shared-feux-45",
    name: "Carrefours à feux",
    description:
      "Une session plus longue pour enchaîner les phases de feu et les intersections.",
    focus: "Carrefours à feux",
    durationMinutes: 45,
    exerciseTypes: [
      "Démarrage au feu",
      "Anticipation",
      "Lecture de signalisation",
    ],
    shareable: true,
  },
  {
    id: "shared-stationnement-45",
    name: "Arrêts et stationnement",
    description:
      "Pour réviser les arrêts sécurisés et les manoeuvres en contexte réel.",
    focus: "Stationnement",
    durationMinutes: 45,
    exerciseTypes: ["Arrêt sécurisé", "Contrôle des angles morts", "Manoeuvre"],
    shareable: true,
  },
  {
    id: "shared-mixte-60",
    name: "Parcours complet",
    description:
      "La version la plus polyvalente, pensée pour travailler plusieurs familles d'exercices.",
    focus: "Mixte",
    durationMinutes: 60,
    exerciseTypes: ["Adaptation", "Anticipation", "Lecture globale"],
    shareable: true,
  },
];

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatOrigin(origin: LatLon) {
  return `${origin.latitude.toFixed(4)}, ${origin.longitude.toFixed(4)}`;
}

function poiText(poi: Poi) {
  return normalizeText(`${poi.name} ${poi.description} ${poi.category}`);
}

function focusScore(poi: Poi, focus: TrainingFocus) {
  const config = FOCUS_CONFIG[focus];
  const text = poiText(poi);
  return config.keywords.reduce((score, keyword) => {
    const hit = text.includes(keyword) ? 18 : 0;
    return score + hit;
  }, 0);
}

function matchesStrictFocus(poi: Poi, focus: TrainingFocus) {
  const config = FOCUS_CONFIG[focus];
  if (!config.strictMatch) {
    return true;
  }

  return config.keywords.some((keyword) => poiText(poi).includes(keyword));
}

function proximityScore(from: LatLon, poi: Poi) {
  const distance = haversineDistance(from, poi);
  return clamp(120 - distance / 35, 0, 120);
}

function stepInstruction(
  focus: TrainingFocus,
  poi: Poi,
  stepIndex: number,
  stepCount: number,
) {
  const config = FOCUS_CONFIG[focus];
  return `${stepIndex + 1}/${stepCount} - ${config.intro} Commencez par ${poi.name} puis observez ${poi.category.toLowerCase()} avant de valider votre trajectoire.`;
}

function buildParcours(input: TrainingGenerationInput): Parcours | null {
  const uniquePois = input.pois.filter(
    (poi, index, list) =>
      list.findIndex((candidate) => candidate.id === poi.id) === index,
  );
  const candidatePois = uniquePois.filter((poi) =>
    matchesStrictFocus(poi, input.focus),
  );

  if (candidatePois.length === 0) {
    return null;
  }

  if (FOCUS_CONFIG[input.focus].strictMatch && candidatePois.length < 3) {
    return null;
  }

  const desiredStepCount = clamp(Math.round(input.durationMinutes / 8), 3, 6);
  const origin: LatLon = input.origin;
  const selected: Poi[] = [];
  const remaining = [...candidatePois];
  let currentPoint = origin;
  let routeBudget = input.durationMinutes * 260;

  while (remaining.length > 0 && selected.length < desiredStepCount) {
    const ranked = remaining
      .map((poi) => {
        const score =
          focusScore(poi, input.focus) +
          proximityScore(currentPoint, poi) +
          proximityScore(origin, poi) * 0.4;
        return { poi, score };
      })
      .sort((left, right) => right.score - left.score);

    const nextCandidate = ranked[0]?.poi;
    if (!nextCandidate) {
      break;
    }

    const travelCost =
      selected.length === 0
        ? haversineDistance(origin, nextCandidate)
        : haversineDistance(currentPoint, nextCandidate);
    if (selected.length >= 2 && routeBudget - travelCost < -250) {
      break;
    }

    selected.push(nextCandidate);
    currentPoint = nextCandidate;
    routeBudget -= travelCost;

    const index = remaining.findIndex((poi) => poi.id === nextCandidate.id);
    if (index >= 0) {
      remaining.splice(index, 1);
    }
  }

  if (selected.length < 3) {
    const fallbackPool = candidatePois
      .filter((poi) => !selected.some((chosen) => chosen.id === poi.id))
      .map((poi) => ({
        poi,
        score: focusScore(poi, input.focus) + proximityScore(origin, poi),
      }))
      .sort((left, right) => right.score - left.score)
      .map(({ poi }) => poi);

    while (
      selected.length < Math.min(desiredStepCount, 3) &&
      fallbackPool.length > 0
    ) {
      const nextPoi = fallbackPool.shift();
      if (!nextPoi) {
        break;
      }
      selected.push(nextPoi);
    }
  }

  if (selected.length === 0) {
    return null;
  }

  const config = FOCUS_CONFIG[input.focus];
  const steps: ParcoursStep[] = selected.map((poi, index) => ({
    poi,
    orderIndex: index,
    instruction: stepInstruction(input.focus, poi, index, selected.length),
  }));
  const sharedSuffix =
    input.mode === "shared" ? " partageable" : " personnalisé";

  return {
    id: `${input.mode}-${input.focus}-${input.durationMinutes}-${selected.map((poi) => poi.id.slice(0, 8)).join("-")}`,
    name: input.name,
    description: `${input.description} Départ ${formatOrigin(origin)}. ${config.intro}${sharedSuffix}.`,
    skill: input.focus,
    durationMinutes: input.durationMinutes,
    steps,
    mode: input.mode,
    exerciseTypes: config.exerciseTypes,
    originLabel: formatOrigin(origin),
    shareable: input.shareable ?? input.mode === "shared",
  };
}

export function buildPersonalizedSession(input: {
  pois: Poi[];
  origin: LatLon;
  focus: TrainingFocus;
  durationMinutes: number;
}): Parcours | null {
  return buildParcours({
    pois: input.pois,
    origin: input.origin,
    focus: input.focus,
    durationMinutes: input.durationMinutes,
    mode: "session",
    name: "Session personnalisée",
    description: `Session de ${input.durationMinutes} min orientée ${input.focus.toLowerCase()}.`,
    shareable: false,
  });
}

export function buildSharedTrainings(input: { pois: Poi[]; origin: LatLon }) {
  return SHARED_PRESETS.map((preset) =>
    buildParcours({
      pois: input.pois,
      origin: input.origin,
      focus: preset.focus,
      durationMinutes: preset.durationMinutes,
      mode: "shared",
      name: preset.name,
      description: preset.description,
      shareable: preset.shareable,
    }),
  )
    .filter((parcours): parcours is Parcours => Boolean(parcours))
    .sort((left, right) => {
      if (left.durationMinutes !== right.durationMinutes) {
        return left.durationMinutes - right.durationMinutes;
      }

      const leftFocus = left.skill.localeCompare(right.skill, "fr");
      if (leftFocus !== 0) {
        return leftFocus;
      }

      const leftDistance = left.steps[0]
        ? haversineDistance(input.origin, left.steps[0].poi)
        : Number.POSITIVE_INFINITY;
      const rightDistance = right.steps[0]
        ? haversineDistance(input.origin, right.steps[0].poi)
        : Number.POSITIVE_INFINITY;
      return leftDistance - rightDistance;
    });
}

export function getTrainingFocusOptions(): TrainingFocus[] {
  return [
    "Giratoires",
    "Priorités à droite",
    "Conduite urbaine",
    "Carrefours à feux",
    "Stationnement",
    "Mixte",
  ];
}

export function getTrainingDurations() {
  return [20, 30, 45, 60] as const;
}
