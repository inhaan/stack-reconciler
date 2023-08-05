import { instantiateComponent } from "./stack_reconciler";

export class DOMComponent {
  currentElement: any;
  renderedChildren: any[];
  node: any;

  constructor(element) {
    this.currentElement = element;
    this.renderedChildren = [];
    this.node = null;
  }

  getPublicInstance() {
    // For DOM components, only expose the DOM node.
    return this.node;
  }

  mount() {
    var element = this.currentElement;

    if (typeof element === "string") {
      var textNode = document.createTextNode(element);
      this.node = textNode;
      return textNode;
    }

    var type = element.type;
    var props = element.props;
    var children = props.children || [];
    if (!Array.isArray(children)) {
      children = [children];
    }

    // Create and save the node
    var node = document.createElement(type);
    this.node = node;

    // Set the attributes
    Object.keys(props).forEach((propName) => {
      if (propName !== "children") {
        node.setAttribute(propName, props[propName]);
      }
    });

    // Create and save the contained children.
    // Each of them can be a DOMComponent or a CompositeComponent,
    // depending on whether the element type is a string or a function.
    var renderedChildren = children.map(instantiateComponent);
    this.renderedChildren = renderedChildren;

    // Collect DOM nodes they return on mount
    var childNodes = renderedChildren.map((child) => child.mount());
    childNodes.forEach((childNode) => node.appendChild(childNode));

    // Return the DOM node as mount result
    return node;
  }

  unmount() {
    // Unmount all the children
    var renderedChildren = this.renderedChildren;
    renderedChildren.forEach((child) => child.unmount());
  }

  receive(nextElement) {
    var node = this.node;
    var prevElement = this.currentElement;
    var prevProps = prevElement.props;
    var nextProps = nextElement.props;
    this.currentElement = nextElement;

    // Remove old attributes.
    if (prevProps) {
      Object.keys(prevProps).forEach((propName) => {
        if (propName !== "children" && !nextProps.hasOwnProperty(propName)) {
          node.removeAttribute(propName);
        }
      });
    }
    // Set next attributes.
    if (nextProps) {
      Object.keys(nextProps).forEach((propName) => {
        if (propName !== "children") {
          node.setAttribute(propName, nextProps[propName]);
        }
      });
    }

    // These are arrays of React elements:
    var prevChildren = prevProps?.children || [];
    if (!Array.isArray(prevChildren)) {
      prevChildren = [prevChildren];
    }
    var nextChildren = nextProps?.children || [];
    if (!Array.isArray(nextChildren)) {
      nextChildren = [nextChildren];
    }
    // These are arrays of internal instances:
    var prevRenderedChildren = this.renderedChildren;
    var nextRenderedChildren: any[] = [];

    // As we iterate over children, we will add operations to the array.
    var operationQueue: any[] = [];

    // Note: the section below is extremely simplified!
    // It doesn't handle reorders, children with holes, or keys.
    // It only exists to illustrate the overall flow, not the specifics.

    for (var i = 0; i < nextChildren.length; i++) {
      // Try to get an existing internal instance for this child
      var prevChild = prevRenderedChildren[i];

      // If there is no internal instance under this index,
      // a child has been appended to the end. Create a new
      // internal instance, mount it, and use its node.
      if (!prevChild) {
        var nextChild = instantiateComponent(nextChildren[i]);
        var node = nextChild?.mount();

        // Record that we need to append a node
        operationQueue.push({ type: "ADD", node });
        nextRenderedChildren.push(nextChild);
        continue;
      }

      // We can only update the instance if its element's type matches.
      // For example, <Button size="small" /> can be updated to
      // <Button size="large" /> but not to an <App />.
      var canUpdate =
        prevChildren[i].type === nextChildren[i].type &&
        typeof prevChildren[i] !== "string";

      // If we can't update an existing instance, we have to unmount it
      // and mount a new one instead of it.
      if (!canUpdate) {
        var prevNode = prevChild.getHostNode();
        prevChild.unmount();

        var nextChild = instantiateComponent(nextChildren[i]);
        var nextNode = nextChild?.mount();

        // Record that we need to swap the nodes
        operationQueue.push({ type: "REPLACE", prevNode, nextNode });
        nextRenderedChildren.push(nextChild);
        continue;
      }

      // If we can update an existing internal instance,
      // just let it receive the next element and handle its own update.
      prevChild.receive(nextChildren[i]);
      nextRenderedChildren.push(prevChild);
    }

    // Finally, unmount any children that don't exist:
    for (var j = nextChildren.length; j < prevChildren.length; j++) {
      var prevChild = prevRenderedChildren[j];
      var node = prevChild.getHostNode();
      prevChild.unmount();

      // Record that we need to remove the node
      operationQueue.push({ type: "REMOVE", node });
    }

    // Point the list of rendered children to the updated version.
    this.renderedChildren = nextRenderedChildren;

    // Process the operation queue.
    while (operationQueue.length > 0) {
      var operation = operationQueue.shift();
      switch (operation.type) {
        case "ADD":
          this.node.appendChild(operation.node);
          break;
        case "REPLACE":
          this.node.replaceChild(operation.nextNode, operation.prevNode);
          break;
        case "REMOVE":
          this.node.removeChild(operation.node);
          break;
      }
    }
  }

  getHostNode() {
    return this.node;
  }
}
