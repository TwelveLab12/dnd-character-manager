"use client";

import {
  BookOpen,
  CalendarDays,
  ChevronDown,
  CornerDownLeft,
  Pencil,
  Plus,
  Trash2,
  XIcon,
} from "lucide-react";
import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import type { Character } from "@/domain/character";
import type { JournalNote, JournalSession, JournalSessionView } from "@/domain/journal";
import {
  journalSessionsView,
  localDateKey,
  nextSessionNumber,
  parseDateKey,
  todaySession,
} from "@/domain/journal";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { isKnownThemeId } from "@/features/character-theme/theme-registry";
import { useSwipeToClose } from "@/features/shared/detail-sheet";
import { useWideScreen } from "@/features/shared/use-wide-screen";
import { usePlayActions } from "./use-play-actions";

type JournalActions = ReturnType<typeof usePlayActions>;

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});
const DATE_WITH_YEAR_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** « Samedi 27 septembre » (l'année seulement si ce n'est pas l'année en cours). */
function formatSessionDate(key: string, today: string): string {
  const date = parseDateKey(key);
  const label = (
    key.slice(0, 4) === today.slice(0, 4) ? DATE_FORMAT : DATE_WITH_YEAR_FORMAT
  ).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count > 1 ? "s" : ""}`;
}

type SessionDialogState = { mode: "create" } | { mode: "edit"; view: JournalSessionView };

/**
 * Journal de l'aventurier (docs/adr/0071) : bouton de l'en-tête du mode jeu, présent sur tous les
 * onglets, qui ouvre un panneau — à droite sur tablette et ordinateur, par le bas sur téléphone.
 * Un point doré signale une session du jour en cours.
 */
export function JournalButton({ character }: { character: Character }) {
  const [open, setOpen] = useState(false);
  const wide = useWideScreen();
  const swipeHandlers = useSwipeToClose(() => setOpen(false));
  const actions = usePlayActions(character.id);
  const [dialog, setDialog] = useState<SessionDialogState>();
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const today = localDateKey(new Date());
  const journal = character.journal ?? [];
  const hasToday = todaySession(journal, today) !== undefined;
  const theme = isKnownThemeId(character.themeId) ? character.themeId : undefined;

  function toggle(sessionId: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (!next.delete(sessionId)) {
        next.add(sessionId);
      }
      return next;
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          aria-label="Journal"
          className="text-primary hover:text-primary relative"
        >
          <BookOpen />
          {hasToday && (
            <span
              aria-hidden
              className="bg-primary ring-card absolute top-1.5 right-1.5 size-1.5 rounded-full ring-2"
            />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent
        side={wide ? "right" : "bottom"}
        showCloseButton={false}
        data-theme={theme}
        className={`bg-card text-card-foreground border-primary/35 gap-0 ring-0 ${
          wide ? "w-full border-l sm:max-w-md" : "h-[88dvh] rounded-t-3xl border-x border-t"
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
              <div className="flex items-baseline gap-2">
                <SheetTitle className="font-heading text-[28px] leading-8 font-semibold">
                  Journal
                </SheetTitle>
                <span className="text-muted-foreground text-sm">
                  {journal.length === 0 ? "Aucune session" : plural(journal.length, "session")}
                </span>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-11 shrink-0"
              onClick={() => setDialog({ mode: "create" })}
            >
              <Plus />
              Session
            </Button>
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
        {open && (
          <JournalContent
            journal={journal}
            today={today}
            actions={actions}
            expanded={expanded}
            onToggle={toggle}
            onCreate={() => setDialog({ mode: "create" })}
            onEdit={(view) => setDialog({ mode: "edit", view })}
          />
        )}
        {dialog && (
          <SessionDialog
            key={dialog.mode === "edit" ? dialog.view.session.id : "create"}
            state={dialog}
            journal={journal}
            today={today}
            theme={theme}
            onClose={() => setDialog(undefined)}
            onSubmit={(values) => {
              if (dialog.mode === "edit") {
                void actions.updateJournalSession(dialog.view.session.id, values);
              } else {
                const id = actions.createJournalSession(values);
                setExpanded((current) => new Set(current).add(id));
              }
              setDialog(undefined);
            }}
            onDelete={() => {
              if (dialog.mode === "edit") {
                void actions.deleteJournalSession(dialog.view.session.id);
              }
              setDialog(undefined);
            }}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function JournalContent({
  journal,
  today,
  actions,
  expanded,
  onToggle,
  onCreate,
  onEdit,
}: {
  journal: readonly JournalSession[];
  today: string;
  actions: JournalActions;
  expanded: ReadonlySet<string>;
  onToggle: (sessionId: string) => void;
  onCreate: () => void;
  onEdit: (view: JournalSessionView) => void;
}) {
  const views = journalSessionsView(journal);
  const current = todaySession(journal, today);
  const currentView = views.find((view) => view.session.id === current?.id);
  const others = views.filter((view) => view !== currentView);

  return (
    <div className="grid min-h-0 flex-1 content-start gap-4 overflow-y-auto border-t px-5 py-4">
      {journal.length === 0 ? (
        <section
          aria-label="Journal vide"
          className="bg-background/50 grid justify-items-center gap-3 rounded-2xl border px-5 pt-7 pb-4 text-center"
        >
          <span className="bg-primary/12 text-primary flex size-14 items-center justify-center rounded-full">
            <BookOpen className="size-6" />
          </span>
          <h3 className="font-heading text-[22px] font-semibold">Journal de l’aventurier</h3>
          <p className="text-muted-foreground max-w-72 text-sm leading-relaxed">
            Consigne ce que le MJ vous révèle : noms, lieux, indices, rendez-vous. Chaque partie
            devient une session, datée du jour.
          </p>
          <div className="mt-1 w-full">
            <NoteComposer
              placeholder="Première note…"
              onAdd={(text) => actions.addJournalNote(text)}
            />
          </div>
          <Button type="button" variant="ghost" className="text-accent h-11" onClick={onCreate}>
            <CalendarDays />
            Recopier des notes d’une partie passée
          </Button>
        </section>
      ) : currentView ? (
        <SessionCard
          view={currentView}
          today={today}
          current
          actions={actions}
          onEdit={() => onEdit(currentView)}
        />
      ) : (
        <section
          aria-label="Session du jour"
          className="border-primary/55 bg-primary/5 grid gap-2.5 rounded-2xl border border-dashed p-4"
        >
          <div className="grid gap-0.5">
            <Kicker className="text-primary">
              Session {nextSessionNumber(journal, today)} · Aujourd’hui
            </Kicker>
            <p className="font-heading text-[22px] leading-tight font-semibold">
              {formatSessionDate(today, today)}
            </p>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            La session démarre avec ta première note. Tu pourras lui donner un titre ou changer sa
            date ensuite.
          </p>
          <NoteComposer
            placeholder="Première note de la session…"
            onAdd={(text) => actions.addJournalNote(text)}
          />
        </section>
      )}

      {others.length > 0 && (
        <section aria-label="Sessions précédentes" className="grid gap-2">
          <h3 className="text-muted-foreground mt-1 text-xs font-semibold tracking-widest uppercase">
            Sessions précédentes
          </h3>
          {others.map((view) =>
            expanded.has(view.session.id) ? (
              <SessionCard
                key={view.session.id}
                view={view}
                today={today}
                actions={actions}
                onEdit={() => onEdit(view)}
                onCollapse={() => onToggle(view.session.id)}
              />
            ) : (
              <SessionRow
                key={view.session.id}
                view={view}
                today={today}
                onExpand={() => onToggle(view.session.id)}
              />
            ),
          )}
        </section>
      )}
    </div>
  );
}

function Kicker({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <span className={`text-[11px] font-semibold tracking-widest uppercase ${className}`}>
      {children}
    </span>
  );
}

function sessionKicker(view: JournalSessionView, today: string): string {
  return [
    `Session ${view.number}`,
    plural(view.notes.length, "note"),
    ...(view.session.date === today ? ["Aujourd’hui"] : []),
  ].join(" · ");
}

function SessionRow({
  view,
  today,
  onExpand,
}: {
  view: JournalSessionView;
  today: string;
  onExpand: () => void;
}) {
  const preview = [view.session.title ?? "Sans titre", view.notes[0]?.text]
    .filter(Boolean)
    .join(" — ");
  return (
    <button
      type="button"
      aria-expanded={false}
      onClick={onExpand}
      className="bg-background/45 hover:bg-background/70 flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors"
    >
      <span className="grid min-w-0 flex-1 gap-0.5">
        <Kicker className="text-muted-foreground">{sessionKicker(view, today)}</Kicker>
        <span className="font-heading text-[17px] font-semibold">
          {formatSessionDate(view.session.date, today)}
        </span>
        <span className="text-muted-foreground truncate text-[13px]">{preview}</span>
      </span>
      <ChevronDown aria-hidden className="text-muted-foreground size-[18px] shrink-0" />
    </button>
  );
}

function SessionCard({
  view,
  today,
  current = false,
  actions,
  onEdit,
  onCollapse,
}: {
  view: JournalSessionView;
  today: string;
  current?: boolean;
  actions: JournalActions;
  onEdit: () => void;
  onCollapse?: () => void;
}) {
  const { session, number, notes } = view;
  const date = formatSessionDate(session.date, today);
  return (
    <section
      aria-label={`Session ${number}`}
      className={`bg-background grid gap-2.5 rounded-2xl border p-4 ${
        current ? "border-primary/35 shadow-lg shadow-black/35" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        <div className="grid min-w-0 flex-1 gap-0.5">
          <Kicker className={current ? "text-primary" : "text-muted-foreground"}>
            {current ? `Session ${number} · Aujourd’hui` : `Session ${number}`}
          </Kicker>
          {onCollapse ? (
            <button
              type="button"
              aria-expanded
              onClick={onCollapse}
              className="font-heading flex items-center gap-1.5 text-left text-[22px] leading-tight font-semibold"
            >
              {date}
              <ChevronDown aria-hidden className="text-muted-foreground size-[18px] rotate-180" />
            </button>
          ) : (
            <p className="font-heading text-[22px] leading-tight font-semibold">{date}</p>
          )}
          {session.title ? (
            <p className="font-heading text-muted-foreground text-base italic">{session.title}</p>
          ) : (
            <p className="text-muted-foreground/70 text-sm">Sans titre</p>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground size-10 shrink-0"
          aria-label={`Modifier la session ${number}`}
          onClick={onEdit}
        >
          <Pencil />
        </Button>
      </div>
      <NoteComposer
        placeholder={current ? "Noter ce que révèle le MJ…" : "Ajouter une note à cette session…"}
        onAdd={(text) => actions.addJournalNote(text, session.id)}
      />
      {notes.length > 0 && (
        <ol className="grid">
          {notes.map((note) => (
            <NoteItem key={note.id} note={note} actions={actions} />
          ))}
        </ol>
      )}
    </section>
  );
}

function NoteComposer({
  placeholder,
  onAdd,
}: {
  placeholder: string;
  onAdd: (text: string) => unknown;
}) {
  const [draft, setDraft] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!draft.trim()) {
      return;
    }
    void onAdd(draft);
    setDraft("");
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <Input
        aria-label="Nouvelle note"
        placeholder={placeholder}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        className="bg-muted-foreground/7 h-11 flex-1 text-[15px] md:text-[15px]"
      />
      <Button
        type="submit"
        size="icon"
        aria-label="Ajouter la note"
        className="size-11 shrink-0 rounded-[10px]"
      >
        <CornerDownLeft />
      </Button>
    </form>
  );
}

function NoteItem({ note, actions }: { note: JournalNote; actions: JournalActions }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.text);

  if (!editing) {
    return (
      <li className="border-muted-foreground/12 border-t">
        <button
          type="button"
          aria-label={`Modifier la note : ${note.text}`}
          onClick={() => {
            setDraft(note.text);
            setEditing(true);
          }}
          className="hover:bg-muted-foreground/6 flex w-full gap-3 rounded-md py-2.5 text-left"
        >
          <span aria-hidden className="bg-primary/80 mt-2 size-1.5 shrink-0 rotate-45" />
          <span className="text-[15px] leading-relaxed break-words whitespace-pre-line">
            {note.text}
          </span>
        </button>
      </li>
    );
  }

  return (
    <li className="border-muted-foreground/12 grid gap-2 border-t py-2.5">
      <Textarea
        aria-label="Texte de la note"
        autoFocus
        rows={3}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        className="text-[15px] md:text-[15px]"
      />
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          className="text-destructive hover:text-destructive h-10"
          onClick={() => void actions.deleteJournalNote(note.id)}
        >
          <Trash2 />
          Supprimer
        </Button>
        <span className="flex-1" />
        <Button type="button" variant="ghost" className="h-10" onClick={() => setEditing(false)}>
          Annuler
        </Button>
        <Button
          type="button"
          className="h-10"
          disabled={!draft.trim()}
          onClick={() => {
            void actions.updateJournalNote(note.id, draft);
            setEditing(false);
          }}
        >
          Enregistrer
        </Button>
      </div>
    </li>
  );
}

function SessionDialog({
  state,
  journal,
  today,
  theme,
  onClose,
  onSubmit,
  onDelete,
}: {
  state: SessionDialogState;
  journal: readonly JournalSession[];
  today: string;
  theme: string | undefined;
  onClose: () => void;
  onSubmit: (values: { date: string; title?: string }) => void;
  onDelete: () => void;
}) {
  const editing = state.mode === "edit" ? state.view : undefined;
  const [date, setDate] = useState(editing?.session.date ?? today);
  const [title, setTitle] = useState(editing?.session.title ?? "");
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (validDate) {
      onSubmit({ date, title });
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent data-theme={theme} className="bg-card text-card-foreground gap-5 sm:max-w-md">
        <form onSubmit={submit} className="grid gap-5">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl font-semibold">
              {editing ? "Modifier la session" : "Nouvelle session"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? `Session ${editing.number} · ${plural(editing.notes.length, "note")}`
                : "Datée d’aujourd’hui par défaut. Pour recopier des notes prises sur papier, choisis la date de la partie."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="journal-session-date">Date de la partie</Label>
              <Input
                id="journal-session-date"
                type="date"
                required
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="h-12 [color-scheme:dark]"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="journal-session-title">
                Titre <span className="text-muted-foreground font-normal">(facultatif)</span>
              </Label>
              <Input
                id="journal-session-title"
                placeholder="ex. Le temple englouti"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="h-12"
              />
            </div>
          </div>
          {!editing && validDate && (
            <p className="text-muted-foreground flex gap-2 text-[13px] leading-relaxed">
              <CalendarDays aria-hidden className="text-accent mt-0.5 size-4 shrink-0" />
              <span>
                Les sessions sont classées et numérotées par date : elle deviendra la{" "}
                <strong className="text-foreground font-semibold">
                  session {nextSessionNumber(journal, date)}
                </strong>
                .
              </span>
            </p>
          )}
          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" className="h-11" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" className="h-11" disabled={!validDate}>
              {editing ? "Enregistrer" : "Créer la session"}
            </Button>
          </DialogFooter>
        </form>
        {editing && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="border-destructive/40 text-destructive hover:text-destructive h-11"
              >
                <Trash2 />
                Supprimer la session
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent data-theme={theme}>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer la session {editing.number} ?</AlertDialogTitle>
                <AlertDialogDescription>
                  {editing.notes.length > 1
                    ? `Ses ${editing.notes.length} notes seront supprimées définitivement.`
                    : editing.notes.length === 1
                      ? "Sa note sera supprimée définitivement."
                      : "Cette session ne contient aucune note."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={onDelete}>
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </DialogContent>
    </Dialog>
  );
}
