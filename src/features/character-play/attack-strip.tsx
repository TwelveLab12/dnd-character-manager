import { Crosshair, Sword } from "lucide-react";
import type { WeaponAttack } from "@/domain/calculations/weapon-attack";
import { DetailsHint } from "@/features/shared/detail-sheet";
import { formatModifier } from "@/features/shared/format";
import { formatWeaponDamage, weaponAttackTags } from "@/features/shared/weapon";

/** Attaques d'armes du HUD de combat : une ligne par arme, bonus au toucher mis en avant ; la ligne
 * ouvre le panneau de détail de l'arme (docs/adr/0042). */
export function AttackStrip({
  attacks,
  onShowDetails,
}: {
  attacks: WeaponAttack[];
  onShowDetails: (itemId: string) => void;
}) {
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
            className="bg-card relative flex items-center gap-3 rounded-xl border px-3 py-2.5 sm:rounded-2xl sm:px-3.5"
          >
            <button
              type="button"
              aria-label={`Détails : ${attack.name || "Arme"}`}
              onClick={() => onShowDetails(attack.itemId)}
              className="hover:bg-foreground/[0.03] focus-visible:ring-ring/50 absolute inset-0 cursor-pointer rounded-xl outline-none focus-visible:ring-3 sm:rounded-2xl"
            />
            <span className="bg-primary/10 text-primary grid size-8 shrink-0 place-items-center rounded-lg sm:size-9">
              <Icon aria-hidden className="size-4" />
            </span>
            <span className="grid min-w-0 flex-1 gap-0.5">
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="truncate text-sm font-medium">{attack.name || "Arme"}</span>
                <DetailsHint className="size-3.5" />
              </span>
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
