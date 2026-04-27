type TutorialStep = {
  id: string;
  target: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  action?: 'click' | 'wait' | 'custom';
};

export const tutorialSteps: TutorialStep[] = [
  {
    id: "start",
    target: "#tools",
    content: "Hier sehen Sie alle Werkzeuge, die Sie zur verfügung haben",
  },
  {
    id: "movetool",
    target: "#movetool",
    content: "Mit diesem Werkzeug, können Sie Patterns bewegen",
  },
  {
    id: "deleteTool",
    target: "#deletetool",
    content: "Mit dem Radiergummi löschen Sie Patterns",
  },
  {
    id: "save",
    target: "#saveButton",
    content: "Vergessen Sie nicht ihr Projekt regelmäßig zu speichern",
  },
  {
    id: "sidebar",
    target: "#sidebar",
    content:
      "Hier sehen Sie all ihre erstellten Projekte, falls Sie sich angemeldet haben. Ohne Anmeldung wird ihr aktuelles Projekt nur lokal gespeichert",
  },
  {
    id: "canvas",
    target: "#canvas",
    content: "Das ist die Zeichenfläche, hier ist ein kleiner Bär zur Vorschau",
  },
  {
    id: "finish",
    target: "#canvas",
    content: "Fangen Sie gleich an selber zu experimentieren",
  },
];
