/**
 * Journal de l'aventurier (docs/adr/0071) : notes courtes prises en partie, regroupées par session
 * de jeu. Une session porte la date de la partie (jour local, `AAAA-MM-JJ`), modifiable après coup
 * pour recopier des notes prises sur papier, et un titre facultatif.
 */
export interface JournalNote {
  id: string;
  text: string;
  createdAt: string;
}

export interface JournalSession {
  id: string;
  /** Jour de la partie, `AAAA-MM-JJ` (heure locale). */
  date: string;
  title?: string;
  notes: JournalNote[];
  createdAt: string;
}

export interface JournalSessionView {
  session: JournalSession;
  /** Rang de la session par date (1 = la plus ancienne). */
  number: number;
  /** Notes de la plus récente à la plus ancienne. */
  notes: JournalNote[];
}

/** Clé `AAAA-MM-JJ` du jour local de `date`. */
export function localDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Date locale (minuit) d'une clé `AAAA-MM-JJ`. */
export function parseDateKey(key: string): Date {
  const [year = 1970, month = 1, day = 1] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function compareChronologically(a: JournalSession, b: JournalSession): number {
  return a.date === b.date ? a.createdAt.localeCompare(b.createdAt) : a.date.localeCompare(b.date);
}

/** Sessions de la plus récente à la plus ancienne (par date de partie), numérotées par date. */
export function journalSessionsView(journal: readonly JournalSession[]): JournalSessionView[] {
  return [...journal]
    .sort(compareChronologically)
    .map((session, index) => ({
      session,
      number: index + 1,
      notes: [...session.notes].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    }))
    .reverse();
}

/** Session du jour : la dernière créée à la date `today`, s'il y en a une. */
export function todaySession(
  journal: readonly JournalSession[],
  today: string,
): JournalSession | undefined {
  return journal
    .filter((session) => session.date === today)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

/** Numéro que prendrait une nouvelle session datée de `date`. */
export function nextSessionNumber(journal: readonly JournalSession[], date: string): number {
  return journal.filter((session) => session.date <= date).length + 1;
}

function cleanTitle(title: string | undefined): string | undefined {
  const trimmed = title?.trim();
  return trimmed ? trimmed : undefined;
}

export interface JournalStamp {
  id: string;
  now: string;
}

export function createSession(
  journal: readonly JournalSession[],
  { date, title }: { date: string; title?: string },
  { id, now }: JournalStamp,
): JournalSession[] {
  const session: JournalSession = { id, date, notes: [], createdAt: now };
  const cleaned = cleanTitle(title);
  return [...journal, cleaned ? { ...session, title: cleaned } : session];
}

export function updateSession(
  journal: readonly JournalSession[],
  sessionId: string,
  { date, title }: { date: string; title?: string },
): JournalSession[] {
  return journal.map((session) => {
    if (session.id !== sessionId) {
      return session;
    }
    const { title: _title, ...rest } = session;
    const cleaned = cleanTitle(title);
    return cleaned ? { ...rest, date, title: cleaned } : { ...rest, date };
  });
}

export function deleteSession(
  journal: readonly JournalSession[],
  sessionId: string,
): JournalSession[] {
  return journal.filter((session) => session.id !== sessionId);
}

/**
 * Ajoute une note à une session. Sans `sessionId`, la note va dans la session du jour, créée à la
 * volée si besoin (`sessionId` du tampon) : la session démarre avec sa première note.
 */
export function addNote(
  journal: readonly JournalSession[],
  text: string,
  target: { sessionId: string } | { today: string; newSessionId: string },
  { id, now }: JournalStamp,
): JournalSession[] {
  const trimmed = text.trim();
  if (!trimmed) {
    return [...journal];
  }
  const note: JournalNote = { id, text: trimmed, createdAt: now };
  let sessions = [...journal];
  let sessionId: string;
  if ("sessionId" in target) {
    sessionId = target.sessionId;
  } else {
    const existing = todaySession(journal, target.today);
    if (existing) {
      sessionId = existing.id;
    } else {
      sessionId = target.newSessionId;
      sessions = createSession(sessions, { date: target.today }, { id: sessionId, now });
    }
  }
  return sessions.map((session) =>
    session.id === sessionId ? { ...session, notes: [...session.notes, note] } : session,
  );
}

export function updateNote(
  journal: readonly JournalSession[],
  noteId: string,
  text: string,
): JournalSession[] {
  const trimmed = text.trim();
  if (!trimmed) {
    return [...journal];
  }
  return journal.map((session) => ({
    ...session,
    notes: session.notes.map((note) => (note.id === noteId ? { ...note, text: trimmed } : note)),
  }));
}

export function deleteNote(journal: readonly JournalSession[], noteId: string): JournalSession[] {
  return journal.map((session) => ({
    ...session,
    notes: session.notes.filter((note) => note.id !== noteId),
  }));
}
