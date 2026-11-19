import { BookOpen, Focus, Pin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function ConcentrationTag() {
  return (
    <Badge className="gap-1 border-transparent bg-info/15 text-info">
      <Focus aria-hidden className="size-3" />
      Concentration
    </Badge>
  );
}

export function RitualTag() {
  return (
    <Badge className="gap-1 border-transparent bg-warning/15 text-warning">
      <BookOpen aria-hidden className="size-3" />
      Rituel
    </Badge>
  );
}

/** Sort toujours préparé (domaine, sous-classe) : ne compte pas dans la limite et ne peut pas être
 * remplacé — identité dorée pour le distinguer d'un coup d'œil des sorts préparés du jour. */
export function AlwaysPreparedTag() {
  return (
    <Badge className="gap-1 border-transparent bg-primary/15 text-primary">
      <Pin aria-hidden className="size-3" />
      Toujours préparé
    </Badge>
  );
}
