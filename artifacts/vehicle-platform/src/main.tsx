import { createRoot } from "react-dom/client";
import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

// Dev: relative /api + Vite proxy → API (see vite.config). Prod: set VITE_API_URL or default below.
const envApi = import.meta.env.VITE_API_URL?.trim();
if (envApi) {
  setBaseUrl(envApi.replace(/\/+$/, ""));
} else if (import.meta.env.DEV) {
  setBaseUrl(null);
} else {
  setBaseUrl("http://localhost:5000");
}
// Attach JWT on every API call (login stores token in localStorage)
setAuthTokenGetter(() => localStorage.getItem("auth_token"));

createRoot(document.getElementById("root")!).render(<App />);
