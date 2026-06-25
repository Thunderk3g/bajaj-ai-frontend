import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/App";
import { logCredits } from "@/lib/credits";
import "@/styles/globals.css";

logCredits();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
