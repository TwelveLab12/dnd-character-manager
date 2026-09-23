import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";

// Vitest globals are off (see vitest.config.ts) so Testing Library can't auto-detect `afterEach`;
// unmount rendered components between tests ourselves to avoid duplicate DOM nodes across tests.
afterEach(() => {
  cleanup();
});

// jsdom doesn't implement the Pointer Events capture API or scrollIntoView, which Radix UI's
// Select (and other pointer-driven components) call internally — without these no-op polyfills,
// clicking a Select in a test throws "target.hasPointerCapture is not a function".
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {};
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {};
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
