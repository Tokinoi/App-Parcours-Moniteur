import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import type { Parcours } from "@/lib/types";

type ParcoursContextValue = {
  activeParcours: Parcours | null;
  currentStepIndex: number;
  elapsedSeconds: number;
  startParcours: (p: Parcours) => void;
  nextStep: () => void;
  abandon: () => void;
};

const ParcoursContext = createContext<ParcoursContextValue>({
  activeParcours: null,
  currentStepIndex: 0,
  elapsedSeconds: 0,
  startParcours: () => {},
  nextStep: () => {},
  abandon: () => {},
});

export function ParcoursProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeParcours, setActiveParcours] = useState<Parcours | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (activeParcours) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeParcours]);

  function startParcours(p: Parcours) {
    setActiveParcours(p);
    setCurrentStepIndex(0);
    setElapsedSeconds(0);
  }

  function nextStep() {
    if (!activeParcours) return;
    setCurrentStepIndex((i) => Math.min(i + 1, activeParcours.steps.length - 1));
  }

  function abandon() {
    setActiveParcours(null);
    setCurrentStepIndex(0);
    setElapsedSeconds(0);
  }

  return (
    <ParcoursContext.Provider
      value={{
        activeParcours,
        currentStepIndex,
        elapsedSeconds,
        startParcours,
        nextStep,
        abandon,
      }}
    >
      {children}
    </ParcoursContext.Provider>
  );
}

export function useParcours() {
  return useContext(ParcoursContext);
}
