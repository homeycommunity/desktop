import { App } from "@/app";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "oidc-react";
import * as React from "react";
import * as ReactDOM from "react-dom/client";

import "@/index.css";
const config = {
  CLIENT_ID: "toq9m4bjq45bv4mko37xp",
  CLIENT_SECRET: "efsrHftGYP4qtRuJu1XA2XtbqBOLyFPi",
};

const redirectUri = "http://localhost:9021/";
const root = document.getElementById("root");
ReactDOM.createRoot(root!).render(
  <React.StrictMode>
    <AuthProvider
      authority="https://accounts.homeycommunity.space/oidc"
      redirectUri={redirectUri}
      clientId={config.CLIENT_ID}
      clientSecret={config.CLIENT_SECRET}
      scope="openid profile email"
    >
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <App />
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>
);
