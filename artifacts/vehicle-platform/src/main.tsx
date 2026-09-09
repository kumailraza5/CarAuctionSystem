import { createRoot } from "react-dom/client";
import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

// Use VITE_API_URL if provided (e.g. separate frontend/backend host).
// Otherwise use null (relative /api requests on same origin for dev proxy and unified production).
const envApi = import.meta.env.VITE_API_URL?.trim();
if (envApi) {
  setBaseUrl(envApi.replace(/\/+$/, ""));
} else {
  setBaseUrl(null);
}

// Attach JWT on every API call (login stores token in localStorage)
setAuthTokenGetter(() => localStorage.getItem("auth_token"));

createRoot(document.getElementById("root")!).render(<App />);
