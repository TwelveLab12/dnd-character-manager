"use client";

import { Hourglass, Moon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Character } from "@/domain/character";
import type { ClassResourceId } from "@/domain/character-class";
import { computeClassResources } from "@/domain/calculations/class-resources";
import { computeWeaponAttacks } from "@/domain/calculations/weapon-attack";
import { ABILITY_LABELS } from "@/features/shared/ability-labels";
import {
  DetailSheet,
  DetailStats,
  DetailText,
  UsePips,
  useLastDefined,
} from "@/features/shared/detail-sheet";
import { FEATURE_RECHARGE_LABELS } from "@/features/shared/feature";
import { formatModifier } from "@/features/shared/format";
import { DAMAGE_TYPE_LABELS, weaponAttackTags } from "@/features/shared/weapon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RECHARGE_LABELS, resourceOptions } from "./class-resource-card";
import { usePlayActions } from "./use-play-actions";

/** Bloc de l'onglet Combat dont le détail est affiché. */
export type CombatDetail =
  | { kind: "feature"; featureId: string }
  | { kind: "option"; resourceId: ClassResourceId; optionKey: string }
  | { kind: "attack"; itemId: string };

interface DetailView {
  eyebrow: string;
  title: string;
  tags?: ReactNode;
  body: ReactNode;
  footer?: ReactNode;
}

/**
 * Panneau de détail de l'onglet Combat (docs/adr/0042), sur la coque commune `DetailSheet` :
 * capacité à utilisations, option d'une ressource de classe (Canalisation divine) ou attaque
 * d'arme. Relu depuis le personnage courant à chaque rendu, pour que les compteurs du pied suivent
 * les utilisations.
 */
export function CombatDetailSheet({
  character,
  detail,
  onClose,
}: {
  character: Character;
  detail: CombatDetail | undefined;
  onClose: () => void;
}) {
  const { adjustFeatureUse, adjustClassResource } = usePlayActions(character.id);
  const shown = useLastDefined(detail);
  const view = shown && resolveView(character, shown);
  if (!view) {
    return null;
  }

  return (
    <DetailSheet
      open={detail !== undefined}
      onOpenChange={(open) => !open && onClose()}
      themeId={character.themeId}
      eyebrow={view.eyebrow}
      title={view.title}
      tags={view.tags}
      footer={view.footer}
    >
      {view.body}
    </DetailSheet>
  );

  function resolveView(character: Character, detail: CombatDetail): DetailView | undefined {
    switch (detail.kind) {
      case "feature": {
        const feature = character.features.find((candidate) => candidate.id === detail.featureId);
        if (!feature) {
          return undefined;
        }
        const max = feature.usesMax ?? 0;
        const remaining = feature.usesCurrent ?? max;
        const recharge =
          feature.recharge && feature.recharge !== "other" ? feature.recharge : undefined;
        return {
          eyebrow: feature.source || "Capacité",
          title: feature.name,
          tags: recharge && <RechargeTag recharge={recharge} />,
          body: <Description text={feature.description} characterId={character.id} />,
          footer: (
            <UseFooter
              label={`Utilisations · ${remaining}/${max}`}
              remaining={remaining}
              total={max}
              rechargeHint={
                recharge && `Revient au prochain ${FEATURE_RECHARGE_LABELS[recharge].toLowerCase()}`
              }
              useLabel={`Utiliser ${feature.name}`}
              onUse={() => {
                void adjustFeatureUse(feature.id, -1);
                onClose();
              }}
            />
          ),
        };
      }
      case "option": {
        const resource = computeClassResources(character).find(
          (candidate) => candidate.id === detail.resourceId,
        );
        const option = resourceOptions(character, detail.resourceId).find(
          (candidate) => candidate.key === detail.optionKey,
        );
        if (!resource || !option) {
          return undefined;
        }
        return {
          eyebrow: [resource.name, option.source].filter(Boolean).join(" · "),
          title: option.name,
          tags: <RechargeTag recharge={resource.recharge} />,
          body: (
            <Description
              text={option.description}
              characterId={character.id}
              // Les règles ne reproduisent aucun texte (docs/adr/0028) : la description d'une
              // option des règles vient d'une capacité de même nom sur la fiche.
              missingHint={
                option.fromRules
                  ? `Pour en ajouter une, crée une capacité « ${option.name} » dans la configuration.`
                  : undefined
              }
            />
          ),
          footer: (
            <UseFooter
              label={`${resource.name} · ${resource.remaining}/${resource.max}`}
              remaining={resource.remaining}
              total={resource.max}
              rechargeHint={`Revient au prochain ${RECHARGE_LABELS[resource.recharge].toLowerCase()}`}
              useLabel={`Utiliser ${option.name}`}
              onUse={() => {
                void adjustClassResource(resource.id, 1);
                onClose();
              }}
            />
          ),
        };
      }
      case "attack": {
        const attack = computeWeaponAttacks(character).find(
          (candidate) => candidate.itemId === detail.itemId,
        );
        if (!attack) {
          return undefined;
        }
        const item = character.inventory.find((candidate) => candidate.id === detail.itemId);
        const tags = weaponAttackTags(attack);
        return {
          eyebrow: attack.range === "ranged" ? "Arme · Distance" : "Arme · Corps à corps",
          title: attack.name || "Arme",
          tags: (!attack.proficient || tags.length > 0) && (
            <>
              {!attack.proficient && (
                <Badge className="bg-warning/15 text-warning border-transparent">
                  Non maîtrisée
                </Badge>
              )}
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </>
          ),
          body: (
            <>
              <DetailStats
                stats={[
                  { label: "Au toucher", value: formatModifier(attack.attackBonus) },
                  { label: "Dégâts", value: attack.damage },
                  { label: "Type", value: DAMAGE_TYPE_LABELS[attack.damageType] },
                  { label: "Caractéristique", value: ABILITY_LABELS[attack.ability] },
                ]}
              />
              {attack.versatileDamage && (
                <p className="text-muted-foreground -mt-1.5 text-[13px]">
                  À deux mains : {attack.versatileDamage}
                </p>
              )}
              {!attack.proficient && (
                <p className="text-warning text-[13px]">
                  Arme non maîtrisée : le bonus de maîtrise n&rsquo;est pas ajouté au toucher.
                </p>
              )}
              {item?.description && <DetailText>{item.description}</DetailText>}
            </>
          ),
        };
      }
    }
  }
}

function RechargeTag({ recharge }: { recharge: "shortRest" | "longRest" }) {
  const Icon = recharge === "shortRest" ? Hourglass : Moon;
  return (
    <Badge variant="outline" className="text-muted-foreground gap-1">
      <Icon aria-hidden className="size-3" />
      {FEATURE_RECHARGE_LABELS[recharge]}
    </Badge>
  );
}

function Description({
  text,
  characterId,
  missingHint,
}: {
  text: string;
  characterId: string;
  missingHint?: string;
}) {
  if (text.trim()) {
    return <DetailText>{text}</DetailText>;
  }
  return (
    <div className="text-muted-foreground grid gap-1.5 rounded-2xl border border-dashed px-4 py-3.5 text-sm">
      <p>Pas de description.{missingHint && ` ${missingHint}`}</p>
      <Link
        href={`/characters/${characterId}/edit?tab=features`}
        className="text-primary w-fit underline underline-offset-4"
      >
        Ajouter une description
      </Link>
    </div>
  );
}

/** Pied des blocs à utilisations : réserve restante et bouton « Utiliser » (ferme le panneau). */
function UseFooter({
  label,
  remaining,
  total,
  rechargeHint,
  useLabel,
  onUse,
}: {
  label: string;
  remaining: number;
  total: number;
  rechargeHint: string | undefined;
  useLabel: string;
  onUse: () => void;
}) {
  const exhausted = remaining <= 0;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="grid flex-1 gap-1.5">
        <span className="text-muted-foreground text-xs">
          {label}
          {exhausted && rechargeHint && ` · ${rechargeHint}`}
        </span>
        {total <= 10 && <UsePips remaining={remaining} total={total} />}
      </div>
      <Button
        type="button"
        size="lg"
        disabled={exhausted}
        aria-label={useLabel}
        onClick={onUse}
        className="h-11 px-5 text-[13px] font-semibold tracking-[0.06em] uppercase"
      >
        Utiliser
      </Button>
    </div>
  );
}
