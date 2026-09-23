"use client";

import { useId } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CharacterTabProps } from "./types";

function toNumber(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function GeneralTab({ draft, onChange }: CharacterTabProps) {
  const nameId = useId();
  const classId = useId();
  const subclassId = useId();
  const raceId = useId();
  const backgroundId = useId();
  const levelId = useId();
  const hpCurrentId = useId();
  const hpMaxId = useId();
  const hpTempId = useId();
  const acId = useId();
  const initiativeId = useId();
  const speedId = useId();
  const meleeId = useId();
  const rangedId = useId();
  const notesId = useId();

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor={nameId}>Nom</Label>
          <Input
            id={nameId}
            value={draft.name}
            onChange={(event) => onChange({ name: event.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={levelId}>Niveau</Label>
          <Input
            id={levelId}
            type="number"
            min={1}
            max={20}
            value={draft.level}
            onChange={(event) => onChange({ level: toNumber(event.target.value) })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={classId}>Classe</Label>
          <Input
            id={classId}
            value={draft.class}
            onChange={(event) => onChange({ class: event.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={subclassId}>Sous-classe</Label>
          <Input
            id={subclassId}
            value={draft.subclass ?? ""}
            onChange={(event) => onChange({ subclass: event.target.value || undefined })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={raceId}>Race</Label>
          <Input
            id={raceId}
            value={draft.race ?? ""}
            onChange={(event) => onChange({ race: event.target.value || undefined })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={backgroundId}>Historique</Label>
          <Input
            id={backgroundId}
            value={draft.background ?? ""}
            onChange={(event) => onChange({ background: event.target.value || undefined })}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor={hpCurrentId}>PV actuels</Label>
          <Input
            id={hpCurrentId}
            type="number"
            value={draft.hitPoints.current}
            onChange={(event) =>
              onChange({ hitPoints: { ...draft.hitPoints, current: toNumber(event.target.value) } })
            }
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={hpMaxId}>PV max</Label>
          <Input
            id={hpMaxId}
            type="number"
            value={draft.hitPoints.max}
            onChange={(event) =>
              onChange({ hitPoints: { ...draft.hitPoints, max: toNumber(event.target.value) } })
            }
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={hpTempId}>PV temporaires</Label>
          <Input
            id={hpTempId}
            type="number"
            value={draft.hitPoints.temporary}
            onChange={(event) =>
              onChange({
                hitPoints: { ...draft.hitPoints, temporary: toNumber(event.target.value) },
              })
            }
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor={acId}>Classe d&rsquo;armure</Label>
          <Input
            id={acId}
            type="number"
            value={draft.armorClass}
            onChange={(event) => onChange({ armorClass: toNumber(event.target.value) })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={initiativeId}>Bonus d&rsquo;initiative</Label>
          <Input
            id={initiativeId}
            type="number"
            value={draft.initiativeBonus}
            onChange={(event) => onChange({ initiativeBonus: toNumber(event.target.value) })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={speedId}>Vitesse (m)</Label>
          <Input
            id={speedId}
            type="number"
            value={draft.speed}
            onChange={(event) => onChange({ speed: toNumber(event.target.value) })}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor={meleeId}>Bonus d&rsquo;attaque en mêlée</Label>
          <Input
            id={meleeId}
            type="number"
            value={draft.meleeAttackBonus ?? ""}
            onChange={(event) =>
              onChange({
                meleeAttackBonus: event.target.value ? toNumber(event.target.value) : undefined,
              })
            }
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={rangedId}>Bonus d&rsquo;attaque à distance</Label>
          <Input
            id={rangedId}
            type="number"
            value={draft.rangedAttackBonus ?? ""}
            onChange={(event) =>
              onChange({
                rangedAttackBonus: event.target.value ? toNumber(event.target.value) : undefined,
              })
            }
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="concentration-active"
          checked={draft.concentration.active}
          onCheckedChange={(checked) =>
            onChange({ concentration: { ...draft.concentration, active: checked === true } })
          }
        />
        <Label htmlFor="concentration-active">Concentration active</Label>
      </div>

      <div className="grid gap-2">
        <Label htmlFor={notesId}>Notes</Label>
        <Textarea
          id={notesId}
          value={draft.notes ?? ""}
          onChange={(event) => onChange({ notes: event.target.value || undefined })}
          rows={4}
        />
      </div>
    </div>
  );
}
