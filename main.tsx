/** @jsx MyReact.createElement */

import * as MyReact from "./my_react";
import * as MyReactDOM from "./my_react-dom";
import { App } from "./App";

var rootEl = document.getElementById("root");
MyReactDOM.render(<App />, rootEl);
