import type { Character } from "@/domain/character";
import { effectiveAbilityScores } from "@/domain/calculations/effective-ability-scores";
import { resolvedSpellAttackBonus, resolvedSpellSaveDC } from "@/domain/calculations/spellcasting";
import { formatModifier } from "@/features/shared/format";
import { SectionTitle } from "@/components/ui/section-title";
import { PreparedSpellsList } from "./prepared-spells-list";
import { ReadOnlyField } from "./read-only-field";
import { SpellSlotsCounter } from "./spell-slots-counter";

export function SpellsViewTab({ character }: { character: Character }) {
  const { spellcasting } = character;

  return (
    <div className="grid gap-6">
      {spellcasting && (
        <div className="grid gap-4 sm:grid-cols-2">
          <ReadOnlyField
            label="DD de sauvegarde"
            value={resolvedSpellSaveDC(
              character.level,
              effectiveAbilityScores(character.abilityScores, character.raceSelection)[
                spellcasting.ability
              ],
              spellcasting.spellSaveDCOverride,
            )}
          />
          <ReadOnlyField
            label="Bonus d'attaque de sort"
            value={formatModifier(
              resolvedSpellAttackBonus(
                character.level,
                effectiveAbilityScores(character.abilityScores, character.raceSelection)[
                  spellcasting.ability
                ],
                spellcasting.spellAttackBonusOverride,
              ),
            )}
          />
        </div>
      )}

      {character.spellSlots.length > 0 && (
        <div className="grid gap-3">
          <SectionTitle>Emplacements de sorts</SectionTitle>
          <SpellSlotsCounter character={character} />
        </div>
      )}

      <PreparedSpellsList character={character} />
    </div>
  );
}
