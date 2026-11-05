import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup, configure } from "@testing-library/react";
configure({ asyncUtilTimeout: 10000 });
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
// jsdom does not perform layout. Give Recharts a deterministic drawing surface.
HTMLElement.prototype.getBoundingClientRect = function () {
  return {
    width: 800,
    height: 450,
    top: 0,
    left: 0,
    right: 800,
    bottom: 450,
    x: 0,
    y: 0,
    toJSON() {
      return this;
    },
  };
};
window.scrollTo = () => {};
Object.defineProperty(document, "fonts", {
  value: { ready: Promise.resolve() },
  configurable: true,
});
