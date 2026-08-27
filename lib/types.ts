export type UserProfile = {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  is_admin?: boolean;
  created_at?: string;
};

export type LoginResponse = {
  message?: string;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  user?: UserProfile;
};

export type SignupResponse = {
  message?: string;
  user?: UserProfile;
};

export type Poi = {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  category: string;
  status: string;
};

export type ParcoursStep = {
  poi: Poi;
  orderIndex: number;
  instruction: string;
};

export type Parcours = {
  id: string;
  name: string;
  description: string;
  skill: string;
  durationMinutes: number;
  steps: ParcoursStep[];
  mode?: "session" | "shared";
  exerciseTypes?: string[];
  originLabel?: string;
  shareable?: boolean;
};

export type TrainingFocus =
  | "Giratoires"
  | "Priorités à droite"
  | "Conduite urbaine"
  | "Carrefours à feux"
  | "Stationnement"
  | "Mixte";

export type TrainingMode = "session" | "shared";

export type TrainingPreset = {
  id: string;
  name: string;
  description: string;
  focus: TrainingFocus;
  durationMinutes: number;
  exerciseTypes: string[];
  shareable: boolean;
};

export type TrainingGenerationInput = {
  pois: Poi[];
  origin: { latitude: number; longitude: number };
  focus: TrainingFocus;
  durationMinutes: number;
  mode: TrainingMode;
  name: string;
  description: string;
  shareable?: boolean;
};
