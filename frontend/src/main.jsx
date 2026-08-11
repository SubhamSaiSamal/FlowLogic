import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";

/* KaTeX stylesheet — critical for math rendering */
import "katex/dist/katex.min.css";

/* subgrad design system */
import "./index.css";

import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      {/* Page views only — no cookies, no accounts, tracks guests same as
          signed-in users. This is how we get a real usage number without
          the sign-in wall we deliberately removed. */}
      <Analytics />
    </BrowserRouter>
  </StrictMode>
);
