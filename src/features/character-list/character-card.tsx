"use client";

import { Eye, Trash2 } from "lucide-react";
import Link from "next/link";
import { computeArmorClass } from "@/domain/calculations/armor-class";
import type { Character } from "@/domain/character";
import { useCharacterStore } from "@/stores/store-provider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function CharacterCard({ character }: { character: Character }) {
  const remove = useCharacterStore((state) => state.remove);
  const armorClass = computeArmorClass(character).total;

  return (
    <Card>
      {/* Toute la zone d'informations mène à la fiche ; le footer (actions) reste hors du lien
          pour ne pas imbriquer d'éléments interactifs. */}
      <Link
        href={`/characters/${character.id}`}
        aria-label={`Voir la fiche de ${character.name}`}
        className="group/link hover:bg-accent/40 focus-visible:ring-ring -my-(--card-spacing) flex flex-col gap-(--card-spacing) py-(--card-spacing) transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset"
      >
        <CardHeader>
          <CardTitle className="flex flex-wrap items-baseline gap-x-2">
            <span>{character.name}</span>
            <span aria-hidden className="text-muted-foreground/60">
              ·
            </span>
            <span className="text-muted-foreground text-xs">
              niv.{" "}
              <span className="text-primary text-xl font-bold tabular-nums">{character.level}</span>
            </span>
          </CardTitle>
          <CardDescription>
            {character.class}
            {character.subclass ? ` (${character.subclass})` : ""}
          </CardDescription>
          <CardAction>
            <Eye
              aria-hidden
              className="text-muted-foreground group-hover/link:text-primary size-5 transition-colors"
            />
          </CardAction>
        </CardHeader>
        <CardContent className="flex justify-center gap-10 pt-2 pb-3">
          <StatBadge
            label="PV"
            value={`${character.hitPoints.current}/${character.hitPoints.max}`}
            description={`Points de vie ${character.hitPoints.current} sur ${character.hitPoints.max}`}
          />
          <StatBadge
            label="CA"
            value={String(armorClass)}
            description={`Classe d'armure ${armorClass}`}
          />
        </CardContent>
      </Link>
      <CardFooter className="justify-end gap-2">
        <Button variant="outline" asChild>
          <Link href={`/characters/${character.id}/edit`}>Configurer</Link>
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive dark:hover:bg-destructive/20"
            >
              <Trash2 />
              Supprimer
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer {character.name} ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible : le personnage sera définitivement supprimé de ce
                navigateur.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                className="bg-destructive hover:bg-destructive/90 text-white"
                onClick={() => void remove(character.id)}
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}

/** Valeur clé mise en médaillon : chiffre centré dans un cercle, label à cheval sur le bord haut. */
function StatBadge({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div
      role="img"
      aria-label={description}
      className="border-primary/60 relative grid size-20 place-items-center rounded-full border-2"
    >
      <span
        aria-hidden
        className="bg-card text-muted-foreground absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 text-[10px] leading-none font-medium tracking-wide uppercase"
      >
        {label}
      </span>
      <span
        aria-hidden
        className={`text-foreground font-semibold tabular-nums ${value.length > 5 ? "text-base" : "text-xl"}`}
      >
        {value}
      </span>
    </div>
  );
}
