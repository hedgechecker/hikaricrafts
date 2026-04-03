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
    content: "Mit diesem Werkzeug, können Sie Punkte und Bilder bewegen",
  },
  {
    id: "pointtool",
    target: "#pointtool",
    content: "Hiermit können Sie einzelne Punkte frei platzieren",
  },
  {
    id: "linetool",
    target: "#linetool",
    content: "Hiermit können Sie Linien platzieren",
  },
  {
    id: "deleteTool",
    target: "#deletetool",
    content: "Mit dem Radiergummi löschen Sie Punkte und Linien",
  },
  {
    id: "addImage",
    target: "#addImageButton",
    content: "Hier können Sie Hintergrundbilder als Referenz einfügen",
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
    content: "Das ist die Zeichenfläche",
  },
  {
    id: "verifytool",
    target: "#verifytool",
    content:
      "Wenn Sie fertig sind mit der Zeichnung können Sie hier ihr Projekt verifizieren und eine Vorschau generieren lassen",
  },
  {
    id: "finish",
    target: "#editor",
    content: "Das war das Tutorial, viel Spaß beim designen",
  },
];
