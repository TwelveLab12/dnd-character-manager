import { Crosshair, Sword } from "lucide-react";
import type { WeaponAttack } from "@/domain/calculations/weapon-attack";
import { formatModifier } from "@/features/shared/format";
import { formatWeaponDamage, weaponAttackTags } from "@/features/shared/weapon";

/** Attaques d'armes du HUD de combat : une ligne par arme, bonus au toucher mis en avant. */
export function AttackStrip({ attacks }: { attacks: WeaponAttack[] }) {
  if (attacks.length === 0) {
    return null;
  }

  return (
    <ul aria-label="Attaques" className="grid gap-2 sm:grid-cols-2">
      {attacks.map((attack) => {
        const Icon = attack.range === "ranged" ? Crosshair : Sword;
        const details = [formatWeaponDamage(attack), ...weaponAttackTags(attack)].join(" · ");
        return (
          <li
            key={attack.itemId}
            className="bg-card flex items-center gap-3 rounded-xl border px-3 py-2.5 sm:rounded-2xl sm:px-3.5"
          >
            <span className="bg-primary/10 text-primary grid size-8 shrink-0 place-items-center rounded-lg sm:size-9">
              <Icon aria-hidden className="size-4" />
            </span>
            <span className="grid min-w-0 flex-1 gap-0.5">
              <span className="truncate text-sm font-medium">{attack.name || "Arme"}</span>
              <span className="text-muted-foreground text-xs">{details}</span>
              {!attack.proficient && (
                <span className="text-warning text-xs">Non maîtrisée (sans bonus de maîtrise)</span>
              )}
            </span>
            <span
              aria-label={`Bonus au toucher ${formatModifier(attack.attackBonus)}`}
              className="font-heading text-primary text-[22px] font-bold tabular-nums sm:text-2xl"
            >
              {formatModifier(attack.attackBonus)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
