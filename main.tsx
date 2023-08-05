/** @jsx MyReact.createElement */

import * as MyReact from "./my_react/react";
import * as MyReactDOM from "./my_react_dom/react_dom";
import { App } from "./App";

var rootEl = document.getElementById("root");
MyReactDOM.render(<App name="철수" />, rootEl);

setTimeout(() => {
  // Should reuse the existing DOM:
  MyReactDOM.render(<App name="영희" />, rootEl);
}, 5000);
