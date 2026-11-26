import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@fontsource-variable/inter";
import "@fontsource-variable/source-serif-4";
import { App } from "./App";
import "./styles/theme.css";

const rootElement = document.getElementById("root");
if (rootElement) {
  const prerenderPath = rootElement.getAttribute("data-prerender-path");
  const rawPath = window.location.pathname;
  const currentPath = rawPath !== "/" ? rawPath.replace(/\/+$/, "") : "/";
  const canHydrate =
    rootElement.hasChildNodes() && (!prerenderPath || prerenderPath === currentPath);

  const tree = (
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );

  if (canHydrate) {
    ReactDOM.hydrateRoot(rootElement, tree);
  } else {
    ReactDOM.createRoot(rootElement).render(tree);
  }
}
