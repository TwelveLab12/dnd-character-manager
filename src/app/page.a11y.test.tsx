import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { RepositoryProvider } from "@/repositories/repository-provider";
import { StoreProvider } from "@/stores/store-provider";
import { a11yViolations } from "@/test/a11y";
import Home from "./page";

// Home renders CharacterList, which reads the stores: mount it inside the same providers as
// src/app/layout.tsx.
describe("Home (accessibilité)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("has no WCAG violation detectable without layout", async () => {
    const { container } = render(
      <RepositoryProvider>
        <StoreProvider>
          <Home />
        </StoreProvider>
      </RepositoryProvider>,
    );
    await screen.findByRole("heading", { level: 1 });
    expect(await a11yViolations(container)).toEqual([]);
  });
});
