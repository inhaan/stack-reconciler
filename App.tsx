/** @jsx MyReact.createElement */

import * as MyReact from "./my_react/react";

export const App = (props) => {
  return (
    <div>
      <h1>hello react! {props.name ?? ""}</h1>
      <h3>my own react!</h3>
    </div>
  );
};
