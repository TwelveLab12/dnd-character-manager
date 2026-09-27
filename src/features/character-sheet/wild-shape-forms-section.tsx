"use client";

import { ChevronDown, PawPrint, Plus, Star, Trash2, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { useId, useState } from "react";
import type { Character } from "@/domain/character";
import { generateId } from "@/domain/id";
import type { DamageType } from "@/domain/inventory";
import { DAMAGE_TYPES } from "@/domain/inventory";
import type { BeastAttack, BeastForm } from "@/domain/wild-shape";
import { isValidDamageDice } from "@/domain/calculations/weapon-attack";
import { wildShapeFormWarnings, wildShapeLimits } from "@/domain/calculations/wild-shape-form";
import { DAMAGE_TYPE_LABELS } from "@/features/shared/weapon";
import { formatDecimal, formatModifier } from "@/features/shared/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  mergeBeastForms,
  parseBeastFormImportEntries,
  previewBeastFormImport,
} from "@/import-export/beast-form-importer";
import { ImportDialog } from "@/features/shared/import-dialog";

/**
 * Formes de la Forme sauvage (docs/adr/0070) : les bêtes habituelles du druide, saisies depuis
 * leur profil. Une seule se déplie à la fois pour être modifiée ; les limites du niveau (FP, vol,
 * nage) sont signalées sans bloquer, le MJ pouvant en décider autrement.
 */
export function WildShapeFormsSection({
  character,
  onChange,
}: {
  character: Character;
  onChange: (patch: Partial<Character>) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const forms = character.wildShapeForms ?? [];
  const limits = wildShapeLimits(character.level);

  function setForms(next: BeastForm[]) {
    onChange({ wildShapeForms: next.length > 0 ? next : undefined });
  }

  function addForm() {
    const form: BeastForm = {
      id: generateId(),
      name: "",
      challengeRating: "1/4",
      strength: 10,
      dexterity: 10,
      constitution: 10,
      armorClass: 10,
      maxHitPoints: 1,
      speed: 9,
      attacks: [],
    };
    setForms([...forms, form]);
    setOpenId(form.id);
  }

  return (
    <section aria-label="Formes sauvages" className="grid gap-2.5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="grid gap-0.5">
          <h4 className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
            Formes sauvages
          </h4>
          <p className="text-muted-foreground text-xs">
            À ce niveau : FP {limits.maxLabel} au plus
            {limits.noSwim ? ", ni nage ni vol" : limits.noFly ? ", pas de vol" : ""}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ImportDialog<BeastForm>
            title="Importer des formes"
            description="Collez le JSON de vos bêtes, ou choisissez un fichier. Une forme de même identifiant (ou de même nom, sans identifiant) est mise à jour."
            triggerVariant="outline"
            placeholder='[{ "name": "Loup", "challengeRating": "1/4", "strength": 12, ... }]'
            parseEntries={parseBeastFormImportEntries}
            preview={(entries) => previewBeastFormImport(entries, forms)}
            onImport={(imported) => {
              const { forms: merged, added, updated } = mergeBeastForms(forms, imported);
              setForms(merged);
              return Promise.resolve({ added, updated, skipped: 0 });
            }}
          />
          <Button type="button" variant="outline" onClick={addForm}>
            <Plus />
            Ajouter une forme
          </Button>
        </div>
      </div>

      {forms.length === 0 ? (
        <p className="text-muted-foreground rounded-xl border border-dashed p-3 text-center text-sm">
          Aucune forme : ajoutez les bêtes dans lesquelles votre druide se transforme (profil du
          Manuel des monstres).
        </p>
      ) : (
        forms.map((form) => (
          <FormCard
            key={form.id}
            form={form}
            warnings={wildShapeFormWarnings(character, form)}
            open={openId === form.id}
            onToggle={() => setOpenId(openId === form.id ? null : form.id)}
          >
            <FormEditor
              form={form}
              onChange={(patch) =>
                setForms(
                  forms.map((candidate) =>
                    candidate.id === form.id ? { ...candidate, ...patch } : candidate,
                  ),
                )
              }
              onRemove={() => {
                setForms(forms.filter((candidate) => candidate.id !== form.id));
                setOpenId(null);
              }}
            />
          </FormCard>
        ))
      )}
    </section>
  );
}

function FormCard({
  form,
  warnings,
  open,
  onToggle,
  children,
}: {
  form: BeastForm;
  warnings: string[];
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const panelId = useId();
  return (
    <div
      className={cn(
        "rounded-xl border transition-colors",
        open ? "border-primary/50 bg-background/70" : "bg-background/35",
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="focus-visible:ring-ring/50 flex w-full items-center gap-3 rounded-xl py-2.5 pr-3 pl-3.5 text-left outline-none focus-visible:ring-3"
      >
        <PawPrint aria-hidden className="text-primary size-4.5 shrink-0" />
        <span className="grid min-w-0 flex-1 gap-0.5">
          <span className="text-[15px] font-medium">{form.name || "Nouvelle forme"}</span>
          <span className="text-muted-foreground truncate text-xs">{formSummary(form)}</span>
        </span>
        {form.favorite && (
          <Star aria-label="Accès rapide" className="fill-warning text-warning size-4 shrink-0" />
        )}
        {warnings.length > 0 && (
          <TriangleAlert aria-label="Hors limites" className="text-warning size-4 shrink-0" />
        )}
        <ChevronDown
          aria-hidden
          className={cn(
            "text-muted-foreground size-4.5 shrink-0 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div id={panelId} className="grid gap-3 border-t p-4">
          {warnings.length > 0 && (
            <ul className="border-warning/40 bg-warning/10 text-warning grid gap-0.5 rounded-lg border px-3 py-2 text-xs">
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}
          {children}
        </div>
      )}
    </div>
  );
}

/** Ex : « FP 1/4 · CA 13 · 11 PV · 12 m ». */
export function formSummary(form: BeastForm): string {
  const speeds = [
    `${formatDecimal(form.speed)} m`,
    ...(form.swimSpeed ? [`nage ${formatDecimal(form.swimSpeed)} m`] : []),
    ...(form.flySpeed ? [`vol ${formatDecimal(form.flySpeed)} m`] : []),
    ...(form.climbSpeed ? [`escalade ${formatDecimal(form.climbSpeed)} m`] : []),
  ];
  return [
    `FP ${form.challengeRating}`,
    `CA ${form.armorClass}`,
    `${form.maxHitPoints} PV`,
    speeds.join(", "),
  ].join(" · ");
}

function FormEditor({
  form,
  onChange,
  onRemove,
}: {
  form: BeastForm;
  onChange: (patch: Partial<BeastForm>) => void;
  onRemove: () => void;
}) {
  const notesId = useId();

  function setAttacks(attacks: BeastAttack[]) {
    onChange({ attacks });
  }

  function addAttack() {
    setAttacks([
      ...form.attacks,
      {
        id: generateId(),
        name: "",
        attackBonus: 0,
        damageDice: "1d4",
        damageBonus: 0,
        damageType: "piercing",
      },
    ]);
  }

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-[minmax(0,1fr)_5rem_5rem_5rem]">
        <TextField
          className="col-span-2 sm:col-span-1"
          label="Nom"
          placeholder="Ex : Loup"
          value={form.name}
          onChange={(name) => onChange({ name })}
        />
        <TextField
          label="FP"
          placeholder="1/4"
          value={form.challengeRating}
          onChange={(challengeRating) => onChange({ challengeRating })}
        />
        <NumberField
          label="CA"
          value={form.armorClass}
          onChange={(armorClass) => onChange({ armorClass: armorClass ?? 10 })}
        />
        <NumberField
          label="PV max"
          min={1}
          value={form.maxHitPoints}
          onChange={(maxHitPoints) => onChange({ maxHitPoints: Math.max(1, maxHitPoints ?? 1) })}
        />
      </div>

      <div className="grid grid-cols-3 gap-3 sm:w-80">
        <NumberField
          label="For"
          min={1}
          value={form.strength}
          onChange={(strength) => onChange({ strength: strength ?? 10 })}
        />
        <NumberField
          label="Dex"
          min={1}
          value={form.dexterity}
          onChange={(dexterity) => onChange({ dexterity: dexterity ?? 10 })}
        />
        <NumberField
          label="Con"
          min={1}
          value={form.constitution}
          onChange={(constitution) => onChange({ constitution: constitution ?? 10 })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <NumberField
          label="Vitesse (m)"
          step={1.5}
          value={form.speed}
          onChange={(speed) => onChange({ speed: speed ?? 0 })}
        />
        <NumberField
          label="Nage (m)"
          step={1.5}
          value={form.swimSpeed}
          onChange={(swimSpeed) => onChange({ swimSpeed: swimSpeed || undefined })}
        />
        <NumberField
          label="Vol (m)"
          step={1.5}
          value={form.flySpeed}
          onChange={(flySpeed) => onChange({ flySpeed: flySpeed || undefined })}
        />
        <NumberField
          label="Escalade (m)"
          step={1.5}
          value={form.climbSpeed}
          onChange={(climbSpeed) => onChange({ climbSpeed: climbSpeed || undefined })}
        />
      </div>

      <div className="grid gap-2">
        <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          Attaques
        </span>
        {form.attacks.map((attack) => (
          <AttackRow
            key={attack.id}
            attack={attack}
            onChange={(patch) =>
              setAttacks(
                form.attacks.map((candidate) =>
                  candidate.id === attack.id ? { ...candidate, ...patch } : candidate,
                ),
              )
            }
            onRemove={() =>
              setAttacks(form.attacks.filter((candidate) => candidate.id !== attack.id))
            }
          />
        ))}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="justify-self-start"
          onClick={addAttack}
        >
          <Plus />
          Ajouter une attaque
        </Button>
      </div>

      <div className="grid gap-1.5">
        <FieldLabel htmlFor={notesId}>Notes</FieldLabel>
        <Textarea
          id={notesId}
          rows={3}
          placeholder="Sens, traits (Odorat aiguisé, Tactique de groupe…), compétences"
          value={form.notes ?? ""}
          onChange={(event) => onChange({ notes: event.target.value || undefined })}
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-pressed={form.favorite === true}
          onClick={() => onChange({ favorite: form.favorite ? undefined : true })}
        >
          <Star
            aria-hidden
            className={form.favorite ? "fill-warning text-warning" : "text-muted-foreground"}
          />
          Accès rapide
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 />
          Supprimer la forme
        </Button>
      </div>
    </div>
  );
}

function AttackRow({
  attack,
  onChange,
  onRemove,
}: {
  attack: BeastAttack;
  onChange: (patch: Partial<BeastAttack>) => void;
  onRemove: () => void;
}) {
  const typeId = useId();
  return (
    <div className="bg-card grid gap-2 rounded-xl border p-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-[minmax(0,1fr)_4.5rem_5rem_4.5rem_8.5rem_auto] sm:items-end">
        <TextField
          className="col-span-2 sm:col-span-1"
          label="Attaque"
          placeholder="Ex : Morsure"
          value={attack.name}
          onChange={(name) => onChange({ name })}
        />
        <NumberField
          label="Toucher"
          value={attack.attackBonus}
          placeholder={formatModifier(0)}
          onChange={(attackBonus) => onChange({ attackBonus: attackBonus ?? 0 })}
        />
        <TextField
          label="Dés"
          placeholder="2d4"
          invalid={!isValidDamageDice(attack.damageDice)}
          value={attack.damageDice}
          onChange={(damageDice) => onChange({ damageDice: damageDice.trim() })}
        />
        <NumberField
          label="+ Dégâts"
          value={attack.damageBonus}
          onChange={(damageBonus) => onChange({ damageBonus: damageBonus ?? 0 })}
        />
        <div className="grid content-start gap-1.5">
          <FieldLabel htmlFor={typeId}>Type</FieldLabel>
          <Select
            value={attack.damageType}
            onValueChange={(value) => onChange({ damageType: value as DamageType })}
          >
            <SelectTrigger id={typeId} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DAMAGE_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {DAMAGE_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Supprimer l’attaque ${attack.name || ""}`.trim()}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive justify-self-end"
          onClick={onRemove}
        >
          <Trash2 />
        </Button>
      </div>
      <Input
        aria-label="Effet de l’attaque"
        placeholder="Effet en plus (ex : JS de Force DD 11 ou à terre)"
        value={attack.notes ?? ""}
        onChange={(event) => onChange({ notes: event.target.value || undefined })}
      />
    </div>
  );
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <Label
      htmlFor={htmlFor}
      className="text-muted-foreground text-xs font-semibold tracking-wider uppercase"
    >
      {children}
    </Label>
  );
}

function TextField({
  label,
  value,
  placeholder,
  invalid,
  className,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  invalid?: boolean;
  className?: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <div className={cn("grid content-start gap-1.5", className)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        placeholder={placeholder}
        aria-invalid={invalid}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  step,
  placeholder,
  onChange,
}: {
  label: string;
  value: number | undefined;
  min?: number;
  step?: number;
  placeholder?: string;
  onChange: (value: number | undefined) => void;
}) {
  const id = useId();
  return (
    <div className="grid content-start gap-1.5">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        min={min}
        step={step}
        placeholder={placeholder ?? "—"}
        className="text-center tabular-nums"
        value={value ?? ""}
        onChange={(event) => {
          const raw = event.target.value;
          const number = Number(raw);
          onChange(raw === "" || !Number.isFinite(number) ? undefined : number);
        }}
      />
    </div>
  );
}
