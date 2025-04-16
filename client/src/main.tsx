import { createRoot } from "react-dom/client";
import App from "./App";
import "./globals.css";
import { ThemeProvider } from "./hooks/use-theme";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);
