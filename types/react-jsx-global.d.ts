import type { JSX as ReactJSX } from 'react';

declare global {
  namespace JSX {
    // Map global JSX types to React 18/19 JSX runtime types
    interface IntrinsicElements extends ReactJSX.IntrinsicElements {}
    interface IntrinsicAttributes extends ReactJSX.IntrinsicAttributes {}
    // Optional: keep Element and ElementClass aligned if needed
    interface Element extends ReactJSX.Element {}
    interface ElementClass extends ReactJSX.ElementClass {}
  }
}
