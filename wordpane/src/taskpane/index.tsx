import * as React from "react";
import * as ReactDOM from "react-dom";
import App from "./components/App";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";

/* global document, Office, module, require */

const title = "Mytender.io Task Pane Add-in";
const container: HTMLElement | null = document.getElementById("container");

/* Render application after Office initializes */
Office.onReady(() => {
  if (container) {
    ReactDOM.render(
      <FluentProvider theme={webLightTheme}>
        <App title={title} />
      </FluentProvider>,
      container
    );
  }
});

if ((module as any).hot) {
  (module as any).hot.accept("./components/App", () => {
    const NextApp = require("./components/App").default;
    if (container) {
      ReactDOM.render(<NextApp />, container);
    }
  });
}
