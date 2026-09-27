import { CharacterPlay } from "@/features/character-play/character-play";

export default async function CharacterPage(props: PageProps<"/characters/[characterId]">) {
  const { characterId } = await props.params;
  const { tab } = await props.searchParams;
  return (
    <CharacterPlay
      characterId={characterId}
      initialTab={typeof tab === "string" ? tab : undefined}
    />
  );
}
