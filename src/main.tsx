/**
 * Point d'entrée autonome (build Vite standard, ex : Cloudflare Pages).
 * Le build propriétaire Figma utilise __figma__entrypoint__.ts ; ici on monte
 * simplement l'app React dans #root.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import App from "./app/App";

const container = document.getElementById("root");
if (!container) throw new Error("Élément #root introuvable dans index.html");

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
