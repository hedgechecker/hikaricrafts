import {
  createContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { tutorialSteps } from "./tutorialStep";

type TutorialContextType = {
  stepIndex: number;
  next: () => void;
  prev: () => void;
  start: () => void;
  stop: () => void;
  active: boolean;
};

export const TutorialContext = createContext<TutorialContextType | null>(null);

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [stepIndex, setStepIndex] = useState(-1);
  const [active, setActive] = useState(false);

  const hasAsked = useRef(false);

  useEffect(() => {
    if (hasAsked.current) return;
    hasAsked.current = true;
  }, []);

  const start = () => {
    setActive(true);
    setStepIndex(0);
  };
  const stop = () => setActive(false);

  const next = () => {
    setStepIndex((i) => i + 1);
    if(tutorialSteps[stepIndex].id == "finish"){
      const url = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, url);
    }
  };
  const prev = () => setStepIndex((i) => i - 1);

  return (
    <TutorialContext.Provider
      value={{ stepIndex, start, stop, next, prev, active }}
    >
      {children}
    </TutorialContext.Provider>
  );
}
