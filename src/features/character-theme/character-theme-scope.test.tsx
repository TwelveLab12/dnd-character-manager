import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CharacterThemeScope } from "./character-theme-scope";

describe("CharacterThemeScope", () => {
  it("sets data-theme for a known theme id", () => {
    render(
      <CharacterThemeScope themeId="selune">
        <p>content</p>
      </CharacterThemeScope>,
    );
    expect(screen.getByText("content").parentElement).toHaveAttribute("data-theme", "selune");
  });

  it("omits data-theme when the theme id is unknown", () => {
    render(
      <CharacterThemeScope themeId="not-a-real-theme">
        <p>content</p>
      </CharacterThemeScope>,
    );
    expect(screen.getByText("content").parentElement).not.toHaveAttribute("data-theme");
  });

  it("omits data-theme when no theme id is set", () => {
    render(
      <CharacterThemeScope>
        <p>content</p>
      </CharacterThemeScope>,
    );
    expect(screen.getByText("content").parentElement).not.toHaveAttribute("data-theme");
  });
});
