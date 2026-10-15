import { CharacterSheet } from "@/features/character-sheet/character-sheet";
import { PageMain } from "@/features/shared/main-landmark";

export default async function CharacterEditPage(
  props: PageProps<"/characters/[characterId]/edit">,
) {
  const { characterId } = await props.params;
  const { tab } = await props.searchParams;
  return (
    <PageMain>
      <CharacterSheet
        characterId={characterId}
        initialTab={typeof tab === "string" ? tab : undefined}
      />
    </PageMain>
  );
}
