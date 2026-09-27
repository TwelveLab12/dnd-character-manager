import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toaster } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  INSTALL_PROMPT_LATER_KEY,
  INSTALL_PROMPT_NEVER_KEY,
  InstallPrompt,
} from "./install-prompt";

function setStandalone(standalone: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({ matches: standalone }) as typeof window.matchMedia;
}

function installEvent(outcome: "accepted" | "dismissed" = "dismissed") {
  const event = new Event("beforeinstallprompt", { cancelable: true });
  const prompt = vi.fn(() => Promise.resolve());
  Object.assign(event, { prompt, userChoice: Promise.resolve({ outcome }) });
  return { event, prompt };
}

function renderPrompt() {
  render(
    <>
      <Toaster />
      <InstallPrompt delayMs={0} />
    </>,
  );
}

async function fire(event: Event) {
  await act(async () => {
    window.dispatchEvent(event);
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe("InstallPrompt", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    setStandalone(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("offers to install when the browser allows it, and opens its prompt", async () => {
    renderPrompt();
    const { event, prompt } = installEvent("accepted");
    await fire(event);

    await screen.findByRole("dialog", { name: "Installer l'application" });
    expect(event.defaultPrevented).toBe(true);
    await userEvent.click(screen.getByRole("button", { name: "Installer" }));
    expect(prompt).toHaveBeenCalledOnce();
    expect(window.localStorage.getItem(INSTALL_PROMPT_NEVER_KEY)).toBe("1");
  });

  it("remembers « Ne plus me demander »", async () => {
    renderPrompt();
    await fire(installEvent().event);
    await screen.findByRole("dialog", { name: "Installer l'application" });

    await userEvent.click(screen.getByRole("checkbox", { name: "Ne plus me demander" }));
    await userEvent.click(screen.getByRole("button", { name: "Plus tard" }));
    expect(window.localStorage.getItem(INSTALL_PROMPT_NEVER_KEY)).toBe("1");
  });

  it("« Plus tard » without the box only waits for the next session", async () => {
    renderPrompt();
    await fire(installEvent().event);
    await screen.findByRole("dialog", { name: "Installer l'application" });

    await userEvent.click(screen.getByRole("button", { name: "Plus tard" }));
    expect(window.localStorage.getItem(INSTALL_PROMPT_NEVER_KEY)).toBeNull();
    expect(window.sessionStorage.getItem(INSTALL_PROMPT_LATER_KEY)).toBe("1");
  });

  it("stays silent when the app is already installed", async () => {
    setStandalone(true);
    renderPrompt();
    await fire(installEvent().event);
    expect(screen.queryByRole("dialog", { name: "Installer l'application" })).toBeNull();
  });

  it("stays silent once the user asked never to be asked again", async () => {
    window.localStorage.setItem(INSTALL_PROMPT_NEVER_KEY, "1");
    renderPrompt();
    await fire(installEvent().event);
    expect(screen.queryByRole("dialog", { name: "Installer l'application" })).toBeNull();
  });

  it("explains the Share menu on iPhone", async () => {
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
    );
    renderPrompt();
    expect(await screen.findByText("Sur l’écran d’accueil")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Installer" })).toBeNull();
    expect(screen.getByRole("button", { name: "Compris" })).toBeInTheDocument();
  });
});
