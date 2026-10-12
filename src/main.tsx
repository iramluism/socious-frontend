import React from "react";
import ReactDOM from "react-dom/client";
import { applyMode, Mode } from "@cloudscape-design/global-styles";
import { applyTheme } from "@cloudscape-design/components/theming";
import "@cloudscape-design/global-styles/index.css";
import { App } from "./app/App";
import "./shared/styles.css";
applyMode(Mode.Dark);
applyTheme({
  theme: {
    tokens: {
      colorBackgroundButtonPrimaryDefault: "#4d6482",
      colorBackgroundButtonPrimaryHover: "#5b7699",
      colorTextButtonPrimaryDefault: "#ffffff",
      colorBorderButtonPrimaryDefault: "#4d6482",
      colorBackgroundContainerContent: "#292b30",
      colorBackgroundLayoutMain: "#202124",
      colorTextBodyDefault: "#d6d8df",
      colorTextHeadingDefault: "#e7e9ee",
      colorTextLinkDefault: "#a4bde1",
      borderRadiusButton: "6px",
      borderRadiusContainer: "9px",
    },
  },
});
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
