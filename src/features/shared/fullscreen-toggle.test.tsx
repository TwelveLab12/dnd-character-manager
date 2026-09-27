import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FullscreenToggle } from "./fullscreen-toggle";

function setFullscreenState(enabled: boolean, element: Element | null) {
  Object.defineProperty(document, "fullscreenEnabled", { configurable: true, value: enabled });
  Object.defineProperty(document, "fullscreenElement", { configurable: true, value: element });
}

describe("FullscreenToggle", () => {
  afterEach(() => {
    setFullscreenState(false, null);
  });

  it("renders nothing when the browser cannot go fullscreen", () => {
    setFullscreenState(false, null);
    const { container } = render(<FullscreenToggle />);
    expect(container).toBeEmptyDOMElement();
  });

  it("enters fullscreen, then offers to leave it", async () => {
    setFullscreenState(true, null);
    const requestFullscreen = vi.fn(() => Promise.resolve());
    document.documentElement.requestFullscreen = requestFullscreen;
    const exitFullscreen = vi.fn(() => Promise.resolve());
    document.exitFullscreen = exitFullscreen;

    const user = userEvent.setup();
    render(<FullscreenToggle />);
    await user.click(screen.getByRole("button", { name: "Plein écran" }));
    expect(requestFullscreen).toHaveBeenCalledOnce();

    act(() => {
      setFullscreenState(true, document.documentElement);
      document.dispatchEvent(new Event("fullscreenchange"));
    });
    await user.click(screen.getByRole("button", { name: "Quitter le plein écran" }));
    expect(exitFullscreen).toHaveBeenCalledOnce();
  });
});
