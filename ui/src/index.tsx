import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "evergreen-ui";
import { MetaplaneTheme } from "super/src/theme";
import { BrowserRouter, HashRouter } from "react-router-dom";
import { App } from "./App";
import type { BootstrapData } from "../../cli/src/dbt/ui/bootstrap";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

declare global {
  interface Window {
    BOOTSTRAP_DATA?: BootstrapData;
  }
}

const standalone = window.BOOTSTRAP_DATA !== undefined;

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider value={MetaplaneTheme}>
      <QueryClientProvider client={queryClient}>
        {standalone ? (
          <HashRouter>
            <App standalone />
          </HashRouter>
        ) : (
          <BrowserRouter>
            <App />
          </BrowserRouter>
        )}
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>
);
