import type { Character } from "@/domain/character";

export interface CharacterTabProps {
  draft: Character;
  onChange: (patch: Partial<Character>) => void;
}
