import { CharacterSheet } from "@/features/character-sheet/character-sheet";

export default async function CharacterEditPage(
  props: PageProps<"/characters/[characterId]/edit">,
) {
  const { characterId } = await props.params;
  const { tab } = await props.searchParams;
  return (
    <CharacterSheet
      characterId={characterId}
      initialTab={typeof tab === "string" ? tab : undefined}
    />
  );
}
