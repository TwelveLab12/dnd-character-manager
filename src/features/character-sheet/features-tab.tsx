"use client";

import { useId } from "react";
import type { CharacterFeature, FeatureRecharge } from "@/domain/feature";
import { generateId } from "@/domain/id";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionTitle } from "@/components/ui/section-title";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { CharacterTabProps } from "./types";

const RECHARGE_LABELS: Record<FeatureRecharge, string> = {
  shortRest: "Repos court",
  longRest: "Repos long",
  other: "Autre",
};

const RECHARGE_VALUES = Object.keys(RECHARGE_LABELS) as FeatureRecharge[];

function toNumber(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function createBlankFeature(): CharacterFeature {
  return { id: generateId(), name: "", source: "", description: "" };
}

export function FeaturesTab({ draft, onChange }: CharacterTabProps) {
  function updateFeature(id: string, patch: Partial<CharacterFeature>) {
    onChange({
      features: draft.features.map((feature) =>
        feature.id === id ? { ...feature, ...patch } : feature,
      ),
    });
  }

  function removeFeature(id: string) {
    onChange({ features: draft.features.filter((feature) => feature.id !== id) });
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <SectionTitle>Capacités (Channel Divinity, domaine…)</SectionTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange({ features: [...draft.features, createBlankFeature()] })}
        >
          Ajouter une capacité
        </Button>
      </div>

      {draft.features.length === 0 && (
        <p className="text-muted-foreground text-sm">Aucune capacité pour l&rsquo;instant.</p>
      )}

      <div className="grid gap-3">
        {draft.features.map((feature) => (
          <FeatureRow
            key={feature.id}
            feature={feature}
            onChange={(patch) => updateFeature(feature.id, patch)}
            onRemove={() => removeFeature(feature.id)}
          />
        ))}
      </div>
    </div>
  );
}

function FeatureRow({
  feature,
  onChange,
  onRemove,
}: {
  feature: CharacterFeature;
  onChange: (patch: Partial<CharacterFeature>) => void;
  onRemove: () => void;
}) {
  const nameId = useId();
  const sourceId = useId();
  const descriptionId = useId();
  const usesMaxId = useId();
  const usesCurrentId = useId();
  const rechargeId = useId();

  return (
    <div className="grid gap-2 rounded-lg border p-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-1">
          <Label htmlFor={nameId} className="text-muted-foreground text-xs">
            Nom
          </Label>
          <Input
            id={nameId}
            value={feature.name}
            onChange={(event) => onChange({ name: event.target.value })}
          />
        </div>
        <div className="grid gap-1">
          <Label htmlFor={sourceId} className="text-muted-foreground text-xs">
            Source
          </Label>
          <Input
            id={sourceId}
            value={feature.source}
            onChange={(event) => onChange({ source: event.target.value })}
            placeholder="ex : Domaine du Crépuscule"
          />
        </div>
      </div>

      <div className="grid gap-1">
        <Label htmlFor={descriptionId} className="text-muted-foreground text-xs">
          Description
        </Label>
        <Textarea
          id={descriptionId}
          value={feature.description}
          onChange={(event) => onChange({ description: event.target.value })}
          rows={2}
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
        <div className="grid gap-1">
          <Label htmlFor={usesMaxId} className="text-muted-foreground text-xs">
            Utilisations max
          </Label>
          <Input
            id={usesMaxId}
            type="number"
            min={0}
            value={feature.usesMax ?? ""}
            onChange={(event) =>
              onChange({ usesMax: event.target.value ? toNumber(event.target.value) : undefined })
            }
          />
        </div>
        <div className="grid gap-1">
          <Label htmlFor={usesCurrentId} className="text-muted-foreground text-xs">
            Utilisations restantes
          </Label>
          <Input
            id={usesCurrentId}
            type="number"
            min={0}
            value={feature.usesCurrent ?? ""}
            onChange={(event) =>
              onChange({
                usesCurrent: event.target.value ? toNumber(event.target.value) : undefined,
              })
            }
          />
        </div>
        <div className="grid gap-1">
          <Label htmlFor={rechargeId} className="text-muted-foreground text-xs">
            Récupération
          </Label>
          <Select
            value={feature.recharge ?? "none"}
            onValueChange={(value) =>
              onChange({ recharge: value === "none" ? undefined : (value as FeatureRecharge) })
            }
          >
            <SelectTrigger id={rechargeId}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              {RECHARGE_VALUES.map((recharge) => (
                <SelectItem key={recharge} value={recharge}>
                  {RECHARGE_LABELS[recharge]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          Retirer
        </Button>
      </div>
    </div>
  );
}
