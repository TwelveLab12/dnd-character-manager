import type { Character } from "@/domain/character";
import { computeSpellSlots } from "@/domain/calculations/spell-slot-table";
import { SectionTitle } from "@/components/ui/section-title";
import { PreparedSpellsList } from "./prepared-spells-list";
import { SpellSlotsCounter } from "./spell-slots-counter";

export function SpellsViewTab({ character }: { character: Character }) {
  return (
    <div className="grid gap-6">
      {computeSpellSlots(character).length > 0 && (
        <div className="grid gap-3">
          <SectionTitle>Emplacements de sorts</SectionTitle>
          <SpellSlotsCounter character={character} />
        </div>
      )}

      <PreparedSpellsList character={character} />
    </div>
  );
}
