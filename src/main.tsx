import React from "react";
import ReactDOM from "react-dom/client";
import { App as AntApp, ConfigProvider, theme } from "antd";
import App from "./App";
import "./styles.scss";

// LUU Y: cac ma mau nay phai khop voi bien $marquee / $velvet... trong styles.scss
const THEME_TOKENS = {
  colorPrimary: "#ffb43c",
  colorBgBase: "#14111a",
  colorBgContainer: "#221a2c",
  colorBgElevated: "#2b2136",
  colorBorder: "rgba(253, 248, 239, 0.12)",
  colorText: "#fdf8ef",
  colorTextSecondary: "#a79cc0",
  borderRadius: 10,
  fontFamily: "system-ui, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: THEME_TOKENS,
      }}>
      <AntApp>
        <App />
      </AntApp>
    </ConfigProvider>
  </React.StrictMode>,
);
