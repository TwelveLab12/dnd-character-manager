import { CharacterPlay } from "@/features/character-play/character-play";
import { PageMain } from "@/features/shared/main-landmark";

export default async function CharacterPage(props: PageProps<"/characters/[characterId]">) {
  const { characterId } = await props.params;
  const { tab } = await props.searchParams;
  return (
    <PageMain>
      <CharacterPlay
        characterId={characterId}
        initialTab={typeof tab === "string" ? tab : undefined}
      />
    </PageMain>
  );
}
