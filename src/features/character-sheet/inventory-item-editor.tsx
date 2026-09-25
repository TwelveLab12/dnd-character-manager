"use client";

import { Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { useId } from "react";
import { cn } from "cn";
import { computeWeaponAttack, isValidDamageDice } from "@/domain/calculations/weapon-attack";
import type { Character } from "@/domain/character";
import type { EquipSlot } from "@/domain/equipment";
import type {
  ArmorCategory,
  ArmorProperties,
  DamageType,
  InventoryItem,
  ItemValue,
  WeaponCategory,
  WeaponProperties,
  WeaponRange,
} from "@/domain/inventory";
import { DAMAGE_TYPES } from "@/domain/inventory";
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
import { COINS } from "@/domain/currency";
import type { Coin } from "@/domain/currency";
import { COIN_LABELS } from "@/features/shared/currency";
import { EquipControl } from "@/features/shared/equip-control";
import { formatModifier } from "@/features/shared/format";
import { QuantityStepper } from "@/features/shared/quantity-stepper";
import {
  DAMAGE_TYPE_LABELS,
  WEAPON_RANGE_LABELS,
  formatWeaponDamage,
} from "@/features/shared/weapon";
import { ITEM_KIND_OPTIONS, itemKind, kindPatch, withArmorCategory } from "./inventory-item-kind";
import { SegmentedControl } from "@/features/shared/segmented-control";

function toNumber(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function optionalNumber(value: string): number | undefined {
  return value ? toNumber(value) : undefined;
}

const WEAPON_CATEGORY_OPTIONS: readonly { value: WeaponCategory; label: string }[] = [
  { value: "simple", label: "Courante" },
  { value: "martial", label: "De guerre" },
];

const WEAPON_RANGE_OPTIONS: readonly { value: WeaponRange; label: string }[] = [
  { value: "melee", label: WEAPON_RANGE_LABELS.melee },
  { value: "ranged", label: WEAPON_RANGE_LABELS.ranged },
];

const ARMOR_CATEGORY_OPTIONS: readonly {
  value: Exclude<ArmorCategory, "shield">;
  label: string;
}[] = [
  { value: "light", label: "Légère" },
  { value: "medium", label: "Intermédiaire" },
  { value: "heavy", label: "Lourde" },
];

/**
 * Panneau d'édition d'un objet déplié (docs/adr/0036) : champs communs (nom, quantité, poids,
 * description), puis ceux de son type — arme (avec l'attaque calculée), armure ou bouclier, ou
 * objet simple (bonus de CA quand il est équipé, ex : anneau de protection).
 */
export function InventoryItemEditor({
  item,
  character,
  onChange,
  onEquip,
  onRemove,
  onClose,
}: {
  item: InventoryItem;
  character: Character;
  onChange: (patch: Partial<InventoryItem>) => void;
  onEquip: (slot: EquipSlot) => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const nameId = useId();
  const weightId = useId();
  const descriptionId = useId();
  const kind = itemKind(item);

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_6rem_10rem] sm:items-end">
        <Field label="Nom" htmlFor={nameId}>
          <Input
            id={nameId}
            placeholder="Nom de l’objet"
            className="font-medium"
            value={item.name}
            onChange={(event) => onChange({ name: event.target.value })}
          />
        </Field>
        <div className="grid gap-1.5">
          <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            Quantité
          </span>
          <QuantityStepper
            label={item.name || "objet"}
            quantity={item.quantity}
            onAdjust={(delta) => onChange({ quantity: Math.max(0, item.quantity + delta) })}
          />
        </div>
        <Field label="Poids (kg)" htmlFor={weightId}>
          <Input
            id={weightId}
            type="number"
            min={0}
            step="0.1"
            value={item.weight ?? ""}
            onChange={(event) => onChange({ weight: optionalNumber(event.target.value) })}
          />
        </Field>
        <ValueField value={item.value} onChange={(value) => onChange({ value })} />
      </div>

      <div className="grid gap-1.5">
        <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          Type
        </span>
        <SegmentedControl
          label="Type d’objet"
          options={ITEM_KIND_OPTIONS}
          value={kind}
          onValueChange={(next) => onChange(kindPatch(item, next))}
        />
      </div>

      {item.weapon && (
        <WeaponFields
          item={item}
          weapon={item.weapon}
          character={character}
          onChange={(weapon) => onChange({ weapon })}
        />
      )}
      {item.armor && <ArmorFields item={item} armor={item.armor} onChange={onChange} />}
      {kind === "item" && <PlainItemFields item={item} onChange={onChange} onEquip={onEquip} />}

      <Field label="Description" htmlFor={descriptionId}>
        <Textarea
          id={descriptionId}
          rows={2}
          placeholder="Effet, origine, notes…"
          value={item.description ?? ""}
          onChange={(event) => onChange({ description: event.target.value || undefined })}
        />
      </Field>

      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="destructive" onClick={onRemove}>
          <Trash2 />
          Supprimer l&rsquo;objet
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          Replier
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="grid content-start gap-1.5">
      <Label
        htmlFor={htmlFor}
        className="text-muted-foreground text-xs font-semibold tracking-wider uppercase"
      >
        {label}
      </Label>
      {children}
    </div>
  );
}

/** Bloc des champs propres au type, sur un fond distinct. */
function TypeBlock({ children }: { children: ReactNode }) {
  return <div className="bg-card grid gap-4 rounded-xl border p-3.5">{children}</div>;
}

/** Propriété d'arme en jeton (Finesse, Légère…). */
function PropertyChip({
  label,
  pressed,
  onPressedChange,
}: {
  label: string;
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={() => onPressedChange(!pressed)}
      className={cn(
        "focus-visible:ring-ring/50 h-9 rounded-full border px-3.5 text-sm font-medium transition-colors outline-none focus-visible:ring-3",
        pressed
          ? "border-primary bg-primary/15 text-foreground"
          : "text-muted-foreground hover:bg-muted/40",
      )}
    >
      {label}
    </button>
  );
}

function WeaponFields({
  item,
  weapon,
  character,
  onChange,
}: {
  item: InventoryItem;
  weapon: WeaponProperties;
  character: Character;
  onChange: (weapon: WeaponProperties) => void;
}) {
  const diceId = useId();
  const damageTypeId = useId();
  const versatileId = useId();
  const magicId = useId();
  const thrownNormalId = useId();
  const thrownLongId = useId();
  const { thrown } = weapon;
  const melee = weapon.range === "melee";
  const attack = computeWeaponAttack(character, item);

  function update(patch: Partial<WeaponProperties>) {
    onChange({ ...weapon, ...patch });
  }

  return (
    <TypeBlock>
      <div className="grid gap-2 sm:grid-cols-2">
        <SegmentedControl
          label="Catégorie d’arme"
          options={WEAPON_CATEGORY_OPTIONS}
          value={weapon.category}
          onValueChange={(category) => update({ category })}
        />
        <SegmentedControl
          label="Portée"
          options={WEAPON_RANGE_OPTIONS}
          value={weapon.range}
          onValueChange={(range) => update({ range })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-[6rem_minmax(0,1fr)_8rem_7rem]">
        <Field label="Dégâts" htmlFor={diceId}>
          <Input
            id={diceId}
            placeholder="1d8"
            className="text-center font-semibold"
            aria-invalid={!isValidDamageDice(weapon.damageDice)}
            value={weapon.damageDice}
            onChange={(event) => update({ damageDice: event.target.value.trim() })}
          />
        </Field>
        <Field label="Type de dégâts" htmlFor={damageTypeId}>
          <Select
            value={weapon.damageType}
            onValueChange={(value) => update({ damageType: value as DamageType })}
          >
            <SelectTrigger id={damageTypeId} className="w-full">
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
        </Field>
        <Field label="Polyvalente" htmlFor={versatileId}>
          <Input
            id={versatileId}
            placeholder="—"
            title="Dégâts à deux mains d’une arme polyvalente"
            className="text-center"
            aria-invalid={
              weapon.versatileDamageDice !== undefined &&
              !isValidDamageDice(weapon.versatileDamageDice)
            }
            value={weapon.versatileDamageDice ?? ""}
            onChange={(event) =>
              update({ versatileDamageDice: event.target.value.trim() || undefined })
            }
          />
        </Field>
        <Field label="Bonus magique" htmlFor={magicId}>
          <Input
            id={magicId}
            type="number"
            placeholder="+0"
            className="text-center"
            value={weapon.magicBonus ?? ""}
            onChange={(event) => update({ magicBonus: optionalNumber(event.target.value) })}
          />
        </Field>
      </div>

      <div className="grid gap-2">
        <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          Propriétés
        </span>
        <div className="flex flex-wrap gap-1.5">
          <PropertyChip
            label="Finesse"
            pressed={weapon.finesse ?? false}
            onPressedChange={(pressed) => update({ finesse: pressed || undefined })}
          />
          {melee && !weapon.twoHanded && (
            <PropertyChip
              label="Légère"
              pressed={weapon.light ?? false}
              onPressedChange={(pressed) => update({ light: pressed || undefined })}
            />
          )}
          <PropertyChip
            label="Deux mains"
            pressed={weapon.twoHanded ?? false}
            onPressedChange={(pressed) =>
              update({ twoHanded: pressed || undefined, ...(pressed ? { light: undefined } : {}) })
            }
          />
          {melee && (
            <PropertyChip
              label="Lancer"
              pressed={thrown !== undefined}
              onPressedChange={(pressed) =>
                update({ thrown: pressed ? { normal: 6, long: 18 } : undefined })
              }
            />
          )}
          {melee && weapon.category === "martial" && (
            <PropertyChip
              label="Arme de moine"
              pressed={weapon.monkWeapon ?? false}
              onPressedChange={(pressed) => update({ monkWeapon: pressed || undefined })}
            />
          )}
        </div>
        {melee && thrown && (
          <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
            <Label htmlFor={thrownNormalId}>Portée de lancer</Label>
            <Input
              id={thrownNormalId}
              type="number"
              min={0}
              className="w-16 text-center"
              value={thrown.normal}
              onChange={(event) =>
                update({ thrown: { ...thrown, normal: toNumber(event.target.value) } })
              }
            />
            <span aria-hidden>/</span>
            <Input
              id={thrownLongId}
              aria-label="Portée longue (m)"
              type="number"
              min={0}
              className="w-16 text-center"
              value={thrown.long}
              onChange={(event) =>
                update({ thrown: { ...thrown, long: toNumber(event.target.value) } })
              }
            />
            <span>m</span>
          </div>
        )}
      </div>

      {attack && (
        <p className="border-primary/25 bg-primary/5 flex flex-wrap items-center gap-2.5 rounded-lg border px-3 py-2">
          <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            Attaque calculée
          </span>
          <span className="bg-primary/15 text-primary rounded-md px-2 py-0.5 font-bold tabular-nums">
            {formatModifier(attack.attackBonus)}
          </span>
          <span className="text-sm">{formatWeaponDamage(attack)}</span>
          {!attack.proficient && (
            <span className="text-warning text-xs">sans maîtrise de cette catégorie</span>
          )}
        </p>
      )}
    </TypeBlock>
  );
}

function ArmorFields({
  item,
  armor,
  onChange,
}: {
  item: InventoryItem;
  armor: ArmorProperties;
  onChange: (patch: Partial<InventoryItem>) => void;
}) {
  const baseId = useId();
  const magicId = useId();
  const strengthId = useId();
  const shield = armor.category === "shield";

  return (
    <TypeBlock>
      {!shield && (
        <SegmentedControl
          label="Catégorie d’armure"
          options={ARMOR_CATEGORY_OPTIONS}
          value={armor.category as Exclude<ArmorCategory, "shield">}
          onValueChange={(category) => onChange({ armor: withArmorCategory(armor, category) })}
        />
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Field label={shield ? "Bonus de CA" : "CA de base"} htmlFor={baseId}>
          <Input
            id={baseId}
            type="number"
            className="text-center font-semibold"
            value={armor.baseArmorClass}
            onChange={(event) =>
              onChange({ armor: { ...armor, baseArmorClass: toNumber(event.target.value) } })
            }
          />
        </Field>
        <Field label="Bonus magique" htmlFor={magicId}>
          <Input
            id={magicId}
            type="number"
            placeholder="+0"
            className="text-center"
            value={item.armorClassBonus ?? ""}
            onChange={(event) => onChange({ armorClassBonus: optionalNumber(event.target.value) })}
          />
        </Field>
        {armor.category === "heavy" && (
          <Field label="Force minimale" htmlFor={strengthId}>
            <Input
              id={strengthId}
              type="number"
              min={0}
              className="text-center"
              value={armor.strengthRequirement ?? ""}
              onChange={(event) =>
                onChange({
                  armor: { ...armor, strengthRequirement: optionalNumber(event.target.value) },
                })
              }
            />
          </Field>
        )}
      </div>
      <p className="text-muted-foreground text-sm">
        {shield
          ? "Équipé, il s’ajoute à la CA."
          : "Équipée, elle remplace 10 + Dex dans le calcul de la CA."}
      </p>
    </TypeBlock>
  );
}

function PlainItemFields({
  item,
  onChange,
  onEquip,
}: {
  item: InventoryItem;
  onChange: (patch: Partial<InventoryItem>) => void;
  onEquip: (slot: EquipSlot) => void;
}) {
  const bonusId = useId();
  return (
    <TypeBlock>
      <div className="grid gap-3 sm:grid-cols-[10rem_auto] sm:items-end">
        <Field label="Bonus de CA" htmlFor={bonusId}>
          <Input
            id={bonusId}
            type="number"
            placeholder="+0"
            className="text-center"
            value={item.armorClassBonus ?? ""}
            onChange={(event) => onChange({ armorClassBonus: optionalNumber(event.target.value) })}
          />
        </Field>
        <EquipControl item={item} onEquip={onEquip} />
      </div>
      <p className="text-muted-foreground text-sm">
        Pour un objet porté qui protège (anneau, cape…) : le bonus compte quand il est équipé.
      </p>
    </TypeBlock>
  );
}

/** Valeur marchande à l'unité (docs/adr/0056) : montant + pièce, po par défaut. Vider le montant
 * retire la valeur. */
function ValueField({
  value,
  onChange,
}: {
  value: ItemValue | undefined;
  onChange: (value: ItemValue | undefined) => void;
}) {
  const amountId = useId();
  const coin = value?.coin ?? "gold";
  return (
    <Field label="Valeur" htmlFor={amountId}>
      <div className="flex gap-1.5">
        <Input
          id={amountId}
          type="number"
          min={0}
          step="any"
          placeholder="—"
          className="min-w-0 flex-1"
          value={value?.amount ?? ""}
          onChange={(event) => {
            const amount = optionalNumber(event.target.value);
            onChange(amount === undefined ? undefined : { amount: Math.max(0, amount), coin });
          }}
        />
        <Select
          value={coin}
          onValueChange={(next) => onChange({ amount: value?.amount ?? 0, coin: next as Coin })}
        >
          <SelectTrigger aria-label="Pièce de la valeur" className="w-[4.5rem]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COINS.map((option) => (
              <SelectItem key={option} value={option}>
                {COIN_LABELS[option].abbreviation}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </Field>
  );
}
