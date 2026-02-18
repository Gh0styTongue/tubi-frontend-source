import * as React from 'react';
import * as ReactDOM from 'react-dom';

/**
 * NOTICE: This file contains a modified and stripped down version of the ReversePortal component,
 * originally from the react-reverse-portal project:
 * https://github.com/httptoolkit/react-reverse-portal
 *
 * Copyright (c) 2019 Tim Perry and contributors
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * This file has been modified from the original source.
 */

type Options = {
    attributes?: { [key: string]: string };
    containerElement?: keyof HTMLElementTagNameMap;
};

type Component<P = Record<string, unknown>> = React.Component<P> | React.ComponentType<P>;

type ComponentProps<C extends Component> = C extends Component<infer P> ? P : never;

interface PortalNode<C extends Component = Component> {
    // Used by the out portal to send props back to the real element
    // Hooked by InPortal to become a state update (and thus rerender)
    setPortalProps(p: Omit<Readonly<OutPortalProps<C>>, 'node'>): void;
    // Used to track props set before the InPortal hooks setPortalProps
    getInitialPortalProps(): ComponentProps<C>;
    // Move the node from wherever it is, to this parent, replacing the placeholder
    mount(newParent: Node, placeholder: Node): void;
    // If mounted, unmount the node and put the initial placeholder back
    // If an expected placeholder is provided, only unmount if that's still that was the
    // latest placeholder we replaced. This avoids some race conditions.
    unmount(expectedPlaceholder?: Node): void;
    element: HTMLElement;
}

const createPortalNode = <C extends Component = Component>(
  options?: Options
): PortalNode<C> => {

  let initialProps: ComponentProps<C>;

  let parent: Node | undefined;
  let lastPlaceholder: Node | undefined;

  const element = document.createElement(options?.containerElement ?? 'div');

  if (options && options.attributes) {
    for (const [key, value] of Object.entries(options.attributes)) {
      element.setAttribute(key, value);
    }
  }

  const portalNode: PortalNode<C> = {
    element,
    setPortalProps: (props: ComponentProps<C>) => {
      initialProps = props;
    },
    getInitialPortalProps: () => {
      return initialProps;
    },
    mount: (newParent: HTMLElement, newPlaceholder: HTMLElement) => {
      if (newPlaceholder === lastPlaceholder) {
        // Already mounted - noop.
        return;
      }
      portalNode.unmount();

      newParent.replaceChild(
        portalNode.element,
        newPlaceholder,
      );

      parent = newParent;
      lastPlaceholder = newPlaceholder;
    },
    unmount: (expectedPlaceholder?: Node) => {
      if (expectedPlaceholder && expectedPlaceholder !== lastPlaceholder) {
        // Skip unmounts for placeholders that aren't currently mounted
        // They will have been automatically unmounted already by a subsequent mount()
        return;
      }

      if (parent && lastPlaceholder) {
        parent.replaceChild(
          lastPlaceholder,
          portalNode.element,
        );

        parent = undefined;
        lastPlaceholder = undefined;
      }
    },
  };

  return portalNode;
};

interface InPortalProps<C extends Component = Component> {
    node: PortalNode<C>;
    children: React.ReactNode;
}

class InPortal<C extends Component = Component> extends React.PureComponent<InPortalProps<C>, { nodeProps: ComponentProps<C> }> {

  constructor(props: InPortalProps<C>) {
    super(props);
    this.state = {
      nodeProps: this.props.node.getInitialPortalProps(),
    };
  }

  addPropsChannel = () => {
    Object.assign(this.props.node, {
      setPortalProps: (props: ComponentProps<C>) => {
        // Rerender the child node here if/when the out portal props change
        this.setState({ nodeProps: props });
      },
    });
  };

  componentDidMount() {
    this.addPropsChannel();
  }

  componentDidUpdate() {
    this.addPropsChannel();
  }

  render() {
    const { children, node } = this.props;

    return ReactDOM.createPortal(
      React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        return React.cloneElement(child, this.state.nodeProps);
      }),
      node.element
    );
  }
}

type OutPortalProps<C extends Component = Component> = {
    node?: PortalNode<C>
} & Partial<ComponentProps<C>>;

class OutPortal<C extends Component = Component> extends React.PureComponent<OutPortalProps<C>> {

  private placeholderNode = React.createRef<HTMLElement>();

  private currentPortalNode?: PortalNode<C>;

  constructor(props: OutPortalProps<C>) {
    super(props);
    this.passPropsThroughPortal();
  }

  passPropsThroughPortal() {
    if (!this.props.node) return;
    const { node, ...propsForTarget } = this.props;
    this.props.node.setPortalProps(propsForTarget);
  }

  componentDidMount() {
    if (!this.props.node) return;
    const node = this.props.node;
    this.currentPortalNode = node;

    const placeholder = this.placeholderNode.current;
    if (!placeholder) return;

    const parent = placeholder.parentNode;
    if (!parent) return;
    node.mount(parent, placeholder);
    this.passPropsThroughPortal();
  }

  componentDidUpdate() {
    // We re-mount on update, just in case we were unmounted (e.g. by
    // a second OutPortal, which has now been removed)
    const node = this.props.node;
    if (!node) return;

    // If we're switching portal nodes, we need to clean up the current one first.
    if (this.currentPortalNode && node !== this.currentPortalNode) {
      this.currentPortalNode.unmount(this.placeholderNode.current!);
      this.currentPortalNode.setPortalProps({} as ComponentProps<C>);
      this.currentPortalNode = node;
    }

    const placeholder = this.placeholderNode.current!;
    const parent = placeholder.parentNode!;
    node.mount(parent, placeholder);
    this.passPropsThroughPortal();
  }

  componentWillUnmount() {
    const node = this.props.node;
    if (!node) return;
    node.unmount(this.placeholderNode.current!);
    node.setPortalProps({} as ComponentProps<C>);
  }

  render() {
    if (!this.props.node) return null;

    // Render a placeholder to the DOM, so we can get a reference into
    // our location in the DOM, and swap it out for the portaled node.
    const tagName = this.props.node.element.tagName.toLowerCase();

    return React.createElement(tagName, { ref: this.placeholderNode });
  }
}

// Backward compatibility aliases
const createHtmlPortalNode = createPortalNode;
type HtmlPortalNode<C extends Component = Component> = PortalNode<C>;

export {
  createHtmlPortalNode,
  InPortal,
  OutPortal,
};

export type { HtmlPortalNode };
