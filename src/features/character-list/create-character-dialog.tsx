"use client";

import { UserPlus } from "lucide-react";
import { useId, useState } from "react";
import type { FormEvent } from "react";
import { createBlankCharacter } from "@/domain/factories";
import { useCharacterStore } from "@/stores/store-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateCharacterDialog() {
  const create = useCharacterStore((state) => state.create);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [characterClass, setCharacterClass] = useState("");
  const [level, setLevel] = useState("1");
  const nameId = useId();
  const classId = useId();
  const levelId = useId();

  function resetForm() {
    setName("");
    setCharacterClass("");
    setLevel("1");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedClass = characterClass.trim();
    if (!trimmedName || !trimmedClass) {
      return;
    }
    await create(
      createBlankCharacter({
        name: trimmedName,
        class: trimmedClass,
        level: Number.parseInt(level, 10) || 1,
      }),
    );
    resetForm();
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          resetForm();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <UserPlus />
          Nouveau personnage
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={(event) => void handleSubmit(event)}>
          <DialogHeader>
            <DialogTitle>Nouveau personnage</DialogTitle>
            <DialogDescription>
              Renseignez les informations de base — le reste se complète depuis la fiche.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor={nameId}>Nom</Label>
              <Input
                id={nameId}
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={classId}>Classe</Label>
              <Input
                id={classId}
                value={characterClass}
                onChange={(event) => setCharacterClass(event.target.value)}
                placeholder="ex : Clerc"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={levelId}>Niveau</Label>
              <Input
                id={levelId}
                type="number"
                min={1}
                max={20}
                value={level}
                onChange={(event) => setLevel(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Annuler
              </Button>
            </DialogClose>
            <Button type="submit">Créer</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
