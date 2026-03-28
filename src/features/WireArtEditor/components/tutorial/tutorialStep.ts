type TutorialStep = {
  id: string;
  target: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  action?: 'click' | 'wait' | 'custom';
};

export const tutorialSteps: TutorialStep[] = [
  {
    id: 'toolbar',
    target: '#tools',
    content: 'Hier sehen Sie alle Werkzeuge, die Sie zur verfügung haben',
  },
  {
    id: 'sidebar',
    target: '#sidebar',
    content:
      'Hier sehen Sie all ihre erstellten Projekte, nachdem Sie sich angemeldet haben. Aber auch ohne Anmeldung wird ihr aktuelles Projekt lokal gespeichert',
  },
  {
    id: 'linetool',
    target: '#linetool',
    content: 'Klicken Sie hier, um das Linien-Werkzeug auszuwählen',
  },
  {
    id: 'canvas',
    target: '#canvas',
    content: 'Klicken Sie irgendwo, um einen Anfangspunkt zu platzieren',
  },
  {
    id: 'canvas',
    target: '#canvas',
    content: 'Klicken Sie irgendeinen weiteren Punkt, um die Linie zu vollenden',
  },
  {
    id: 'verifytool',
    target: '#verifytool',
    content: 'Hier sehen Sie ein fertiges Projekt, um es zu visualisieren, kicken Sie hier',
  },
  {
    id: 'finish',
    target: '#editor',
    content: 'Das war das Tutorial, viel Spaß beim designen',
  },
];
