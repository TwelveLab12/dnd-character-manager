"use client";

import { useEffect, useId } from "react";
import type { Character } from "@/domain/character";
import { playAvailableSpellIds } from "@/domain/calculations/spell-availability";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useSpellStore } from "@/stores/store-provider";
import { usePlayActions } from "./use-play-actions";

const NO_SPELL = "none";

export function ConcentrationMarker({ character }: { character: Character }) {
  const { toggleConcentration, setConcentrationSpell } = usePlayActions(character.id);
  const spells = useSpellStore((state) => state.spells);
  const loadSpells = useSpellStore((state) => state.load);
  const switchId = useId();
  const active = character.concentration.active;

  useEffect(() => {
    void loadSpells();
  }, [loadSpells]);

  const availableIds = new Set(playAvailableSpellIds(character));
  const concentrationSpells = spells
    .filter((spell) => spell.concentration && availableIds.has(spell.id))
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));

  return (
    <div className="grid justify-items-end gap-2">
      <div className="flex items-center gap-2">
        <Label htmlFor={switchId} className={active ? "text-info" : "text-muted-foreground"}>
          Concentration
        </Label>
        <Switch id={switchId} checked={active} onCheckedChange={() => void toggleConcentration()} />
      </div>
      {active && concentrationSpells.length > 0 && (
        <Select
          value={character.concentration.spellId ?? NO_SPELL}
          onValueChange={(value) =>
            void setConcentrationSpell(value === NO_SPELL ? undefined : value)
          }
        >
          <SelectTrigger size="sm" aria-label="Sort de concentration" className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_SPELL}>Sort non précisé</SelectItem>
            {concentrationSpells.map((spell) => (
              <SelectItem key={spell.id} value={spell.id}>
                {spell.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
