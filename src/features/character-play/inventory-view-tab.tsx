import type { Character } from "@/domain/character";
import { Badge } from "@/components/ui/badge";

export function InventoryViewTab({ character }: { character: Character }) {
  if (character.inventory.length === 0) {
    return <p className="text-muted-foreground text-sm">Aucun objet pour l&rsquo;instant.</p>;
  }

  return (
    <div className="grid gap-3">
      {character.inventory.map((item) => (
        <div key={item.id} className="grid gap-1 rounded-lg border p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">{item.name}</span>
            <span className="text-muted-foreground text-xs">×{item.quantity}</span>
            {item.weight !== undefined && (
              <span className="text-muted-foreground text-xs">{item.weight} kg</span>
            )}
            {item.equipped && <Badge variant="secondary">Équipé</Badge>}
          </div>
          {item.description && <p className="text-muted-foreground text-xs">{item.description}</p>}
        </div>
      ))}
    </div>
  );
}
