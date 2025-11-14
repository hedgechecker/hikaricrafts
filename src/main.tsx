import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import WoodenCasesSite from "./home/home.tsx";
import './styles/theme.css';

function Main() {
  const [showWoodenSite, setShowWoodenSite] = useState(true);

  return (
    <div>
      <button onClick={() => setShowWoodenSite(!showWoodenSite)}>
        Switch Site
      </button>
      {showWoodenSite ? <WoodenCasesSite /> : <App />}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Main />
  </StrictMode>
);

