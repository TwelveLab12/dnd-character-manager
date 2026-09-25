"use client";

import { Pencil } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";
import type { Character } from "@/domain/character";
import { findClassResourceDefinition } from "@/domain/character-class";
import type { CharacterFeature } from "@/domain/feature";
import { Button } from "@/components/ui/button";
import { DetailsHint } from "@/features/shared/detail-sheet";
import { hasOwnUses } from "@/features/shared/feature";
import { FeatureUsageCards } from "./feature-usage-card";
import type { PlayDetail } from "./play-detail-sheet";
import { PlayDetailSheet } from "./play-detail-sheet";

/** Capacités sans compteur propre, regroupées par origine (Race, Clerc, Dons…) dans l'ordre de la
 * fiche. */
function groupBySource(features: readonly CharacterFeature[]): [string, CharacterFeature[]][] {
  const groups = new Map<string, CharacterFeature[]>();
  for (const feature of features) {
    const source = feature.source.trim() || "Autres";
    groups.set(source, [...(groups.get(source) ?? []), feature]);
  }
  return [...groups];
}

/**
 * Onglet « Capacités » du mode jeu : les capacités à utilisations en tête (aussi présentes dans le
 * bandeau de combat), puis les autres par origine (dons compris) : chaque ligne ouvre le panneau de
 * détail (docs/adr/0043).
 */
export function FeaturesViewTab({ character }: { character: Character }) {
  const [detail, setDetail] = useState<PlayDetail | undefined>();
  const tracked = character.features.filter(hasOwnUses);
  const others = character.features.filter((feature) => !hasOwnUses(feature));
  const count = character.features.length;

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          {count} capacité{count > 1 ? "s" : ""}
          {tracked.length > 0 && ` · ${tracked.length} à utilisations`}
        </p>
        <Button variant="outline" asChild>
          <Link
            href={`/characters/${character.id}/edit?tab=features`}
            aria-label="Modifier les capacités"
          >
            <Pencil />
            Modifier<span className="max-sm:hidden"> les capacités</span>
          </Link>
        </Button>
      </div>

      {count === 0 && (
        <p className="text-muted-foreground text-sm">Aucune capacité pour l&rsquo;instant.</p>
      )}

      {tracked.length > 0 && (
        <FeatureGroup title="À utiliser">
          <div className="grid gap-3 sm:grid-cols-2">
            <FeatureUsageCards character={character} showDescription />
          </div>
        </FeatureGroup>
      )}

      {groupBySource(others).map(([source, features]) => (
        <FeatureGroup key={source} title={source}>
          <div className="grid gap-1.5">
            {features.map((feature) => (
              <button
                key={feature.id}
                type="button"
                aria-label={`Détails : ${feature.name}`}
                onClick={() => setDetail({ kind: "feature", featureId: feature.id })}
                className="bg-background/35 hover:bg-foreground/[0.04] focus-visible:ring-ring/50 flex min-h-11 w-full cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-2 text-left transition-colors outline-none focus-visible:ring-3"
              >
                <span className="flex-1 text-[15px] font-medium">{feature.name}</span>
                {feature.resourceId && (
                  <span className="border-primary/35 bg-primary/10 text-primary shrink-0 rounded-full border px-2 py-0.5 text-[11px]">
                    {findClassResourceDefinition(character.classId, feature.resourceId)?.name ??
                      feature.resourceId}
                  </span>
                )}
                <DetailsHint />
              </button>
            ))}
          </div>
        </FeatureGroup>
      ))}

      <PlayDetailSheet character={character} detail={detail} onClose={() => setDetail(undefined)} />
    </div>
  );
}

function FeatureGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title} className="grid gap-2">
      <h3 className="text-muted-foreground text-[11px] font-semibold tracking-widest uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}
