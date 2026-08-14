import { describe, expect, it } from "vitest";

import {
  buildPersonalizedSession,
  buildSharedTrainings,
} from "@/lib/training-engine";
import type { Poi } from "@/lib/types";

const origin = {
  latitude: 45.7579,
  longitude: 4.832,
};

const pois: Poi[] = [
  {
    id: "poi-rond-point",
    name: "Rond-point de Gerland",
    description: "Rond-point multi-voies avec trafic soutenu.",
    latitude: 45.7283,
    longitude: 4.8258,
    category: "Rond-point",
    status: "active",
  },
  {
    id: "poi-rond-point-2",
    name: "Rond-point Gabriel Péri",
    description: "Giratoire dense avec plusieurs voies d'insertion.",
    latitude: 45.7477,
    longitude: 4.8252,
    category: "Giratoire",
    status: "active",
  },
  {
    id: "poi-rond-point-3",
    name: "Giratoire de Mermoz",
    description: "Giratoire résidentiel adapté à l'apprentissage.",
    latitude: 45.737,
    longitude: 4.8697,
    category: "Giratoire",
    status: "active",
  },
  {
    id: "poi-priorite",
    name: "Carrefour Saxe-Gambetta",
    description: "Carrefour à feux avec priorité à droite sur les voies secondaires.",
    latitude: 45.7521,
    longitude: 4.8439,
    category: "Carrefour à feux",
    status: "active",
  },
  {
    id: "poi-urbain",
    name: "Gare de la Part-Dieu",
    description: "Zone dense avec flux piéton et bus.",
    latitude: 45.7605,
    longitude: 4.859,
    category: "Zone dense",
    status: "active",
  },
  {
    id: "poi-stationnement",
    name: "Cours Vitton",
    description: "Avenue commerçante avec livraison et stationnement.",
    latitude: 45.7648,
    longitude: 4.853,
    category: "Stationnement",
    status: "active",
  },
];

describe("training engine", () => {
  it("builds a personalised session from live POIs", () => {
    const session = buildPersonalizedSession({
      pois,
      origin,
      focus: "Giratoires",
      durationMinutes: 30,
    });

    expect(session).not.toBeNull();
    expect(session?.mode).toBe("session");
    expect(session?.durationMinutes).toBe(30);
    expect(session?.steps.length).toBeGreaterThanOrEqual(3);
    expect(new Set(session?.steps.map((step) => step.poi.id)).size).toBe(
      session?.steps.length,
    );
    expect(session?.skill).toBe("Giratoires");
  });

  it("sorts shareable trainings by duration then exercise focus", () => {
    const trainings = buildSharedTrainings({ pois, origin });

    expect(trainings.length).toBeGreaterThan(0);
    expect(trainings.every((training) => training.mode === "shared")).toBe(true);

    const durations = trainings.map((training) => training.durationMinutes);
    expect(durations).toEqual([...durations].sort((left, right) => left - right));

    expect(trainings[0]?.durationMinutes).toBe(20);
    expect(trainings[0]?.shareable).toBe(true);
    expect(trainings[0]?.skill).toBe("Giratoires");
  });
});
