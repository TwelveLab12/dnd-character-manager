"use client";

import {
  Activity,
  Backpack,
  Heart,
  History,
  Moon,
  Sparkles,
  Trash2,
  XIcon,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type {
  ActivityCategory,
  ActivityChange,
  ActivityEntry,
  ActivityRetention,
} from "@/domain/activity-log";
import { ACTIVITY_CATEGORY_LABELS, ACTIVITY_RETENTION_CHOICES } from "@/domain/activity-log";
import type { Character } from "@/domain/character";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { isKnownThemeId } from "@/features/character-theme/theme-registry";
import { useSwipeToClose } from "@/features/shared/detail-sheet";
import { SegmentedControl } from "@/features/shared/segmented-control";
import { useActivityLogStore } from "@/stores/store-provider";

const EMPTY: ActivityEntry[] = [];

const CATEGORY_ICONS: Record<ActivityCategory, LucideIcon> = {
  "hit-points": Heart,
  spells: Sparkles,
  resources: Zap,
  inventory: Backpack,
  rest: Moon,
  status: Activity,
};

const CATEGORY_TONES: Record<ActivityCategory, string> = {
  "hit-points": "text-destructive bg-destructive/12",
  spells: "text-primary bg-primary/12",
  resources: "text-warning bg-warning/12",
  inventory: "text-muted-foreground bg-muted-foreground/12",
  rest: "text-info bg-info/12",
  status: "text-foreground bg-foreground/10",
};

type Filter = ActivityCategory | "all";

const TIME_FORMAT = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });
const DAY_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

const WIDE_QUERY = "(min-width: 640px)";

// `matchMedia` peut manquer (environnement de test) : on retombe alors sur le panneau à droite.
function wideQuery(): MediaQueryList | undefined {
  return typeof window.matchMedia === "function" ? window.matchMedia(WIDE_QUERY) : undefined;
}

function subscribeWide(onChange: () => void) {
  const query = wideQuery();
  query?.addEventListener("change", onChange);
  return () => query?.removeEventListener("change", onChange);
}

/** Écran d'au moins 640 px : panneau à droite ; sinon, panneau par le bas (glisser pour fermer). */
function useWideScreen(): boolean {
  return useSyncExternalStore(
    subscribeWide,
    () => wideQuery()?.matches ?? true,
    () => true,
  );
}

/**
 * Historique des actions du mode jeu (docs/adr/0061) : bouton de l'en-tête, présent sur tous les
 * onglets, qui ouvre un panneau — à droite sur tablette et ordinateur, par le bas sur téléphone.
 * Entrées groupées par jour, filtrables par catégorie ; durée de conservation et purge manuelle en
 * pied de panneau.
 */
export function ActivityLogButton({ character }: { character: Character }) {
  const [open, setOpen] = useState(false);
  const wide = useWideScreen();
  const swipeHandlers = useSwipeToClose(() => setOpen(false));

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="ghost" size="icon-lg" aria-label="Historique">
          <History />
        </Button>
      </SheetTrigger>
      <SheetContent
        side={wide ? "right" : "bottom"}
        showCloseButton={false}
        data-theme={isKnownThemeId(character.themeId) ? character.themeId : undefined}
        className={`bg-card text-card-foreground border-primary/35 gap-0 ring-0 ${
          wide ? "w-full border-l sm:max-w-md" : "max-h-[88dvh] rounded-t-3xl border-x border-t"
        }`}
      >
        <div
          className={wide ? "" : "cursor-grab touch-none select-none active:cursor-grabbing"}
          {...(wide ? {} : swipeHandlers)}
        >
          {!wide && (
            <div aria-hidden className="flex justify-center pt-2.5 pb-1">
              <span className="bg-muted-foreground/45 h-1 w-10 rounded-full" />
            </div>
          )}
          <div className="flex items-start gap-2 pt-4 pr-3 pb-3 pl-5">
            <div className="grid min-w-0 flex-1 gap-1">
              <SheetDescription className="text-primary text-[11px] font-semibold tracking-widest uppercase">
                {character.name}
              </SheetDescription>
              <SheetTitle className="font-heading text-[28px] leading-8 font-semibold">
                Historique
              </SheetTitle>
            </div>
            <SheetClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="bg-muted-foreground/12 size-11 shrink-0 rounded-full"
              >
                <XIcon />
                <span className="sr-only">Fermer</span>
              </Button>
            </SheetClose>
          </div>
        </div>
        {open && <ActivityLogContent characterId={character.id} />}
      </SheetContent>
    </Sheet>
  );
}

function ActivityLogContent({ characterId }: { characterId: string }) {
  const entries = useActivityLogStore((state) => state.entries[characterId]) ?? EMPTY;
  const load = useActivityLogStore((state) => state.load);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    void load(characterId);
  }, [load, characterId]);

  const categories = useMemo(
    () =>
      (Object.keys(ACTIVITY_CATEGORY_LABELS) as ActivityCategory[]).filter((category) =>
        entries.some((entry) => entry.category === category),
      ),
    [entries],
  );
  const days = useMemo(() => groupByDay(entries, filter), [entries, filter]);

  return (
    <>
      {categories.length > 1 && (
        <div
          role="radiogroup"
          aria-label="Filtrer l'historique"
          className="flex [scrollbar-width:none] gap-1.5 overflow-x-auto px-5 pb-3"
        >
          {(["all", ...categories] as Filter[]).map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={filter === value}
              onClick={() => setFilter(value)}
              className={`h-8 shrink-0 rounded-full border px-3 text-xs font-medium whitespace-nowrap transition-colors ${
                filter === value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {value === "all" ? "Tout" : ACTIVITY_CATEGORY_LABELS[value]}
            </button>
          ))}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto border-t px-5 py-4">
        {days.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            Aucune action enregistrée pour l’instant. Les dégâts, soins, sorts, repos, ressources et
            objets utilisés en mode jeu apparaîtront ici.
          </p>
        ) : (
          <div className="grid gap-5">
            {days.map((day) => (
              <section key={day.key} aria-label={day.label} className="grid gap-2">
                <h3 className="text-muted-foreground text-[11px] font-semibold tracking-widest uppercase">
                  {day.label}
                </h3>
                <ol className="grid gap-2">
                  {day.entries.map((entry) => (
                    <ActivityRow key={entry.id} entry={entry} />
                  ))}
                </ol>
              </section>
            ))}
          </div>
        )}
      </div>

      <ActivityLogFooter characterId={characterId} entries={entries} />
    </>
  );
}

function ActivityRow({ entry }: { entry: ActivityEntry }) {
  const Icon = CATEGORY_ICONS[entry.category];
  return (
    <li className="bg-background/50 flex gap-3 rounded-xl border px-3 py-2.5">
      <span
        aria-hidden
        className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full ${CATEGORY_TONES[entry.category]}`}
      >
        <Icon className="size-3.5" />
      </span>
      <div className="grid min-w-0 flex-1 gap-0.5">
        <div className="flex items-baseline gap-2">
          <p className="min-w-0 flex-1 text-sm font-semibold break-words">{entry.title}</p>
          <time dateTime={entry.at} className="text-muted-foreground shrink-0 text-xs tabular-nums">
            {TIME_FORMAT.format(new Date(entry.at))}
          </time>
        </div>
        {entry.details?.map((detail) => (
          <p key={detail} className="text-sm">
            {detail}
          </p>
        ))}
        {entry.changes.length > 0 && (
          <ul className="text-muted-foreground grid gap-0.5 text-xs">
            {entry.changes.map((change) => (
              <li key={change.key}>
                <ChangeLine change={change} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

function ChangeLine({ change }: { change: ActivityChange }) {
  const delta =
    typeof change.from === "number" && typeof change.to === "number"
      ? change.to - change.from
      : undefined;
  return (
    <>
      {change.label} : <span className="tabular-nums">{change.from}</span> →{" "}
      <span className="text-foreground tabular-nums">{change.to}</span>
      {delta !== undefined && delta !== 0 && (
        <span
          className={`ml-1 font-semibold tabular-nums ${delta > 0 ? "text-success" : "text-destructive"}`}
        >
          ({delta > 0 ? "+" : "−"}
          {Math.abs(delta)})
        </span>
      )}
    </>
  );
}

const RETENTION_LABELS = new Map<ActivityRetention, string>([
  [7, "7 j"],
  [30, "30 j"],
  [90, "90 j"],
  [null, "Illimité"],
]);

function ActivityLogFooter({
  characterId,
  entries,
}: {
  characterId: string;
  entries: ActivityEntry[];
}) {
  const retention = useActivityLogStore((state) => state.retention);
  const setRetention = useActivityLogStore((state) => state.setRetention);
  const clear = useActivityLogStore((state) => state.clear);
  const size = useMemo(() => new Blob([JSON.stringify(entries)]).size, [entries]);

  return (
    <div className="bg-background/40 grid gap-3 border-t px-5 pt-3 pb-5">
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground shrink-0 text-xs">Conserver</span>
        <SegmentedControl<string>
          label="Durée de conservation de l'historique"
          className="flex-1"
          options={ACTIVITY_RETENTION_CHOICES.map((choice) => ({
            value: String(choice),
            label: RETENTION_LABELS.get(choice) ?? String(choice),
          }))}
          value={String(retention)}
          onValueChange={(value) =>
            void setRetention(value === "null" ? null : (Number(value) as ActivityRetention))
          }
        />
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-xs tabular-nums">
          {entries.length} entrée{entries.length > 1 ? "s" : ""} · {formatSize(size)} · 1 000 max.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="outline" size="sm" disabled={entries.length === 0}>
              <Trash2 />
              Vider
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Vider l’historique ?</AlertDialogTitle>
              <AlertDialogDescription>
                Les {entries.length} entrées de ce personnage seront supprimées de cet appareil. La
                fiche n’est pas modifiée.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={() => void clear(characterId)}>Vider</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

function formatSize(bytes: number): string {
  return bytes < 1024 ? `${bytes} o` : `${(bytes / 1024).toFixed(1).replace(".", ",")} Ko`;
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/** Entrées de la plus récente à la plus ancienne, groupées par jour (heure locale). */
function groupByDay(entries: readonly ActivityEntry[], filter: Filter) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const days: { key: string; label: string; entries: ActivityEntry[] }[] = [];
  for (const entry of [...entries].reverse()) {
    if (filter !== "all" && entry.category !== filter) {
      continue;
    }
    const date = new Date(entry.at);
    const key = dayKey(date);
    let day = days.at(-1);
    if (day?.key !== key) {
      const label =
        key === dayKey(today)
          ? "Aujourd’hui"
          : key === dayKey(yesterday)
            ? "Hier"
            : DAY_FORMAT.format(date);
      day = { key, label, entries: [] };
      days.push(day);
    }
    day.entries.push(entry);
  }
  return days;
}
