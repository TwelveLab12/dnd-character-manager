"use client";

import { Minus, Plus } from "lucide-react";
import type { Character } from "@/domain/character";
import { findClassResourceDefinition } from "@/domain/character-class";
import { computeClassResources } from "@/domain/calculations/class-resources";
import { Button } from "@/components/ui/button";
import { SectionTitle } from "@/components/ui/section-title";
import { usePlayActions } from "./use-play-actions";

/**
 * Affiche toutes les capacités du personnage — un compteur +/- pour celles qui suivent un nombre
 * d'utilisations (`usesMax` défini), nom/source/description en lecture seule pour les autres
 * (traits passifs, capacités sans limite suivie).
 */
const RECHARGE_LABELS = { shortRest: "repos court", longRest: "repos long" } as const;

export function FeaturesUsageList({ character }: { character: Character }) {
  const { adjustFeatureUse, adjustClassResource } = usePlayActions(character.id);
  const classResources = computeClassResources(character);

  if (character.features.length === 0 && classResources.length === 0) {
    return <p className="text-muted-foreground text-sm">Aucune capacité pour l&rsquo;instant.</p>;
  }

  return (
    <section className="grid gap-3">
      <SectionTitle>Capacités</SectionTitle>
      {classResources.map((resource) => (
        <div
          key={resource.id}
          className="flex items-center justify-between gap-2 rounded-lg border p-2"
        >
          <div>
            <p className="text-sm font-medium">{resource.name}</p>
            <p className="text-muted-foreground text-xs">
              Ressource de classe · {RECHARGE_LABELS[resource.recharge]}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={resource.remaining <= 0}
              onClick={() => void adjustClassResource(resource.id, 1)}
              aria-label={`Utiliser ${resource.name}`}
            >
              <Minus />
            </Button>
            <span className="w-12 text-center text-sm tabular-nums">
              {resource.remaining} / {resource.max}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={resource.used <= 0}
              onClick={() => void adjustClassResource(resource.id, -1)}
              aria-label={`Récupérer ${resource.name}`}
            >
              <Plus />
            </Button>
          </div>
        </div>
      ))}
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
