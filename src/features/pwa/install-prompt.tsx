"use client";

import { Download, Share } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

/** Choix « Ne plus me demander », mémorisé sur l'appareil. */
export const INSTALL_PROMPT_NEVER_KEY = "dnd-character-manager:install-prompt-never";
/** « Plus tard » : pas avant la prochaine session (onglet ou application rouverts). */
export const INSTALL_PROMPT_LATER_KEY = "dnd-character-manager:install-prompt-later";

const TOAST_ID = "install-prompt";
/** Laisse la page s'afficher avant de proposer l'installation. */
const DEFAULT_DELAY_MS = 3000;

/** Événement Chromium (non standard) qui permet de déclencher l'invite d'installation. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function safely<T>(read: () => T, fallback: T): T {
  try {
    return read();
  } catch {
    return fallback;
  }
}

/** Application ouverte depuis l'écran d'accueil ou en fenêtre d'application. */
export function isInstalled(): boolean {
  const standalone =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(display-mode: standalone)").matches;
  return standalone || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

/** iPhone ou iPad (iPadOS se présente comme un Mac tactile) : installation par le menu Partager. */
export function isIos(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isSilenced(): boolean {
  return safely(
    () =>
      window.localStorage.getItem(INSTALL_PROMPT_NEVER_KEY) === "1" ||
      window.sessionStorage.getItem(INSTALL_PROMPT_LATER_KEY) === "1",
    false,
  );
}

function silence(forever: boolean) {
  safely(() => {
    if (forever) {
      window.localStorage.setItem(INSTALL_PROMPT_NEVER_KEY, "1");
    } else {
      window.sessionStorage.setItem(INSTALL_PROMPT_LATER_KEY, "1");
    }
  }, undefined);
}

/**
 * Invitation à installer l'application (docs/adr/0064), montée une fois dans le layout : un toast
 * qui reste affiché jusqu'à un choix, seulement si l'application n'est pas déjà installée.
 * - Chrome, Edge, Android : bouton « Installer » (invite du navigateur, `beforeinstallprompt`) ;
 * - iPhone, iPad : l'invite n'est pas programmable, le toast explique le menu Partager ;
 * - autres navigateurs (Firefox ordinateur…) : installation impossible, rien n'est affiché.
 * « Ne plus me demander » est mémorisé sur l'appareil ; sinon « Plus tard » vaut pour la session.
 */
export function InstallPrompt({ delayMs = DEFAULT_DELAY_MS }: { delayMs?: number }) {
  useEffect(() => {
    if (isInstalled() || isSilenced()) {
      return;
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    // Le choix du joueur est relu à chaque fois : le navigateur peut renvoyer
    // `beforeinstallprompt` bien après la réponse (navigation, nouvelle estimation), et
    // l'écouteur, monté une fois dans le layout, est toujours là.
    const show = (installEvent?: BeforeInstallPromptEvent) => {
      clearTimeout(timer);
      if (isSilenced()) {
        return;
      }
      timer = setTimeout(() => {
        if (isInstalled() || isSilenced()) {
          return;
        }
        toast.custom((id) => <InstallToast toastId={id} installEvent={installEvent} />, {
          id: TOAST_ID,
          duration: Infinity,
        });
      }, delayMs);
    };

    function onBeforeInstallPrompt(event: Event) {
      // Empêche la mini-barre du navigateur : l'invitation passe par notre toast, et plus rien
      // n'est proposé une fois que le joueur a dit non.
      event.preventDefault();
      show(event as BeforeInstallPromptEvent);
    }
    function onInstalled() {
      silence(true);
      toast.dismiss(TOAST_ID);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    if (isIos()) {
      show();
    }
    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [delayMs]);

  return null;
}

function InstallToast({
  toastId,
  installEvent,
}: {
  toastId: string | number;
  installEvent?: BeforeInstallPromptEvent;
}) {
  const [never, setNever] = useState(false);
  const checkboxId = useId();

  function close(forever: boolean) {
    silence(forever);
    toast.dismiss(toastId);
  }

  async function install() {
    if (!installEvent) {
      return;
    }
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    // Installée : plus de question. Refusée dans l'invite : on respecte la case, sinon plus tard.
    close(outcome === "accepted" || never);
  }

  return (
    <div
      role="dialog"
      aria-label="Installer l'application"
      className="bg-popover text-popover-foreground grid w-[min(356px,calc(100vw-2rem))] gap-3 rounded-xl border p-4 shadow-lg"
    >
      <div className="flex gap-3">
        <span className="bg-primary/15 text-primary flex size-9 shrink-0 items-center justify-center rounded-full">
          <Download aria-hidden className="size-4" />
        </span>
        <div className="grid gap-1">
          <p className="text-sm font-semibold">Installer l’application</p>
          {installEvent ? (
            <p className="text-muted-foreground text-xs">
              Ouvrez vos personnages en un geste depuis l’écran d’accueil, en plein écran et même
              sans connexion.
            </p>
          ) : (
            <p className="text-muted-foreground text-xs">
              Touchez <Share aria-label="Partager" className="inline size-3.5 align-text-bottom" />{" "}
              <strong className="text-foreground">Partager</strong>, puis{" "}
              <strong className="text-foreground">Sur l’écran d’accueil</strong> : vos personnages
              s’ouvriront en plein écran, même sans connexion.
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id={checkboxId}
          checked={never}
          onCheckedChange={(checked) => setNever(checked === true)}
        />
        <Label htmlFor={checkboxId} className="text-muted-foreground text-xs font-normal">
          Ne plus me demander
        </Label>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => close(never)}>
          {installEvent ? "Plus tard" : "Compris"}
        </Button>
        {installEvent && (
          <Button type="button" size="sm" onClick={() => void install()}>
            <Download />
            Installer
          </Button>
        )}
      </div>
    </div>
  );
}
