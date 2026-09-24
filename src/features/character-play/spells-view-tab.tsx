import type { Character } from "@/domain/character";
import { PreparedSpellsList } from "./prepared-spells-list";

/** Les emplacements de sorts sont dans le HUD de combat, toujours visible (docs/adr/0024). */
export function SpellsViewTab({ character }: { character: Character }) {
  return (
    <div className="grid gap-6">
      <PreparedSpellsList character={character} />
    </div>
  );
}
