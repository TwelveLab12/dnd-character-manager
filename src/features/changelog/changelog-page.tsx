"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { PageTitle } from "@/components/ui/page-title";
import { FullscreenToggle } from "@/features/shared/fullscreen-toggle";
import { CHANGELOG } from "./changelog-entries";
import { useChangelogVisit } from "./use-changelog-seen";

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function formatDate(date: string): string {
  return DATE_FORMAT.format(new Date(`${date}T00:00:00Z`));
}

/**
 * Page « Nouveautés » (docs/adr/0058) : les évolutions de l'application, la plus récente en
 * premier. Les entrées pas encore vues sur cet appareil portent « Nouveau » le temps de la visite ;
 * la plus récente est marquée vue dès l'ouverture.
 */
export function ChangelogPage() {
  const { seenBeforeVisit, startVisit } = useChangelogVisit();

  useEffect(() => {
    startVisit();
  }, [startVisit]);

  // Première visite : tout serait « Nouveau », on ne marque rien.
  const previousIndex = seenBeforeVisit
    ? CHANGELOG.findIndex((entry) => entry.id === seenBeforeVisit)
    : -1;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link
            href="/"
            className="text-muted-foreground inline-flex items-center gap-1 text-sm underline underline-offset-4"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Mes personnages
          </Link>
          <PageTitle>Nouveautés</PageTitle>
        </div>
        <FullscreenToggle />
      </div>

      <ol className="grid gap-4">
        {CHANGELOG.map((entry, index) => (
          <li key={entry.id}>
            <article aria-label={entry.title} className="bg-card grid gap-3 rounded-xl border p-4">
              <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="font-heading text-lg font-semibold">{entry.title}</h2>
                {index < previousIndex && <Badge>Nouveau</Badge>}
                <time dateTime={entry.date} className="text-muted-foreground ml-auto text-xs">
                  {formatDate(entry.date)}
                </time>
              </header>
              <ul className="text-muted-foreground grid list-disc gap-1.5 pl-5 text-sm">
                {entry.changes.map((change) => (
                  <li key={change}>{change}</li>
                ))}
              </ul>
              {entry.action && (
                <p className="border-primary/40 bg-primary/10 rounded-lg border px-3 py-2 text-sm">
                  <span className="text-primary font-semibold">À faire : </span>
                  {entry.action}
                </p>
              )}
            </article>
          </li>
        ))}
      </ol>
    </div>
  );
}
