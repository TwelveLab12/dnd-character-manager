import { CharacterSheet } from "@/features/character-sheet/character-sheet";

export default async function CharacterEditPage(
  props: PageProps<"/characters/[characterId]/edit">,
) {
  const { characterId } = await props.params;
  return <CharacterSheet characterId={characterId} />;
}
