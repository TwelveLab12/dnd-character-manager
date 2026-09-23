import { CharacterSheet } from "@/features/character-sheet/character-sheet";

export default async function CharacterPage(props: PageProps<"/characters/[characterId]">) {
  const { characterId } = await props.params;
  return <CharacterSheet characterId={characterId} />;
}
