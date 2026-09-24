"use client";

import { Minus, Plus } from "lucide-react";
import type { Character } from "@/domain/character";
import { findClassResourceDefinition } from "@/domain/character-class";
import { Button } from "@/components/ui/button";
import { SectionTitle } from "@/components/ui/section-title";
import { usePlayActions } from "./use-play-actions";

/**
 * Affiche toutes les capacités du personnage — un compteur +/- pour celles qui suivent un nombre
 * d'utilisations (`usesMax` défini), nom/source/description en lecture seule pour les autres
 * (traits passifs, capacités sans limite suivie). Les réserves de classe (Canalisation divine…)
 * et les capacités qui y puisent s'utilisent depuis le HUD de combat (docs/adr/0024).
 */
export function FeaturesUsageList({ character }: { character: Character }) {
  const { adjustFeatureUse } = usePlayActions(character.id);

  if (character.features.length === 0) {
    return <p className="text-muted-foreground text-sm">Aucune capacité pour l&rsquo;instant.</p>;
  }

  return (
    <section className="grid gap-3">
      <SectionTitle>Capacités</SectionTitle>
      <div className="grid gap-2">
        {character.features.map((feature) => {
          const usesMax = feature.usesMax;
          const current = feature.usesCurrent ?? usesMax ?? 0;
          return (
            <div key={feature.id} className="grid gap-1 rounded-lg border p-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{feature.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {feature.source}
                    {feature.resourceId &&
                      ` · consomme : ${
                        findClassResourceDefinition(character.classId, feature.resourceId)?.name ??
                        feature.resourceId
                      }`}
                  </p>
                </div>
                {usesMax !== undefined && (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      disabled={current <= 0}
                      onClick={() => void adjustFeatureUse(feature.id, -1)}
                      aria-label={`Diminuer les utilisations de ${feature.name}`}
                    >
                      <Minus />
                    </Button>
                    <span className="w-12 text-center text-sm tabular-nums">
                      {current} / {usesMax}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      disabled={current >= usesMax}
                      onClick={() => void adjustFeatureUse(feature.id, 1)}
                      aria-label={`Augmenter les utilisations de ${feature.name}`}
                    >
                      <Plus />
                    </Button>
                  </div>
                )}
              </div>
              {feature.description && (
                <p className="text-muted-foreground text-xs">{feature.description}</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
