import { CharacterPlay } from "@/features/character-play/character-play";

export default async function CharacterPage(props: PageProps<"/characters/[characterId]">) {
  const { characterId } = await props.params;
  return <CharacterPlay characterId={characterId} />;
}
