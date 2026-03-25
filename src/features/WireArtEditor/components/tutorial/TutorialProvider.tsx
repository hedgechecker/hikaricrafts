import { createContext, useState, type ReactNode } from 'react';

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
  const [active, setActive] = useState(true);

  const start = () => {
    setActive(true);
    setStepIndex(0);
    console.log("started")
  };
  const stop = () => setActive(false);

  const next = () => setStepIndex((i) => i + 1);
  const prev = () => setStepIndex((i) => i - 1);

  return (
    <TutorialContext.Provider value={{ stepIndex, start, stop, next, prev, active }}>
      {children}
    </TutorialContext.Provider>
  );
}
