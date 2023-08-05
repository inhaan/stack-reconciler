import { CompositeComponent } from "./CompositeComponent";
import { DOMComponent } from "./DOMComponent";

export function isClass(type) {
  // React.Component subclasses have this flag
  return Boolean(type.prototype) && Boolean(type.prototype.isReactComponent);
}

export function instantiateComponent(element) {
  var type = element.type;
  if (typeof type === "function") {
    // User-defined components
    return new CompositeComponent(element);
  } else if (typeof type === "string" || typeof element === "string") {
    // Platform-specific components
    return new DOMComponent(element);
  }
}
