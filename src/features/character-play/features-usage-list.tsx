"use client";

import { Minus, Plus } from "lucide-react";
import type { Character } from "@/domain/character";
import { Button } from "@/components/ui/button";
import { SectionTitle } from "@/components/ui/section-title";
import { usePlayActions } from "./use-play-actions";

export function FeaturesUsageList({ character }: { character: Character }) {
  const { adjustFeatureUse } = usePlayActions(character.id);

  const trackedFeatures = character.features.filter((feature) => feature.usesMax !== undefined);

  if (trackedFeatures.length === 0) {
    return null;
  }

  return (
    <section className="grid gap-3">
      <SectionTitle>Capacités</SectionTitle>
      <div className="grid gap-2">
        {trackedFeatures.map((feature) => {
          const usesMax = feature.usesMax ?? 0;
          const current = feature.usesCurrent ?? usesMax;
          return (
            <div
              key={feature.id}
              className="flex items-center justify-between gap-2 rounded-lg border p-2"
            >
              <div>
                <p className="text-sm font-medium">{feature.name}</p>
                <p className="text-muted-foreground text-xs">{feature.source}</p>
              </div>
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
            </div>
          );
        })}
      </div>
    </section>
  );
}
