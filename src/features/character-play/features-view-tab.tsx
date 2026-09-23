import type { Character } from "@/domain/character";
import { FeaturesUsageList } from "./features-usage-list";

export function FeaturesViewTab({ character }: { character: Character }) {
  return <FeaturesUsageList character={character} />;
}
