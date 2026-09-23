import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";

// Vitest globals are off (see vitest.config.ts) so Testing Library can't auto-detect `afterEach`;
// unmount rendered components between tests ourselves to avoid duplicate DOM nodes across tests.
afterEach(() => {
  cleanup();
});
