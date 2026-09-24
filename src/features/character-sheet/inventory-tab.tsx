"use client";

import { Plus, X } from "lucide-react";
import { useId } from "react";
import { isValidDamageDice } from "@/domain/calculations/weapon-attack";
import type { Character } from "@/domain/character";
import type { EquipSlot } from "@/domain/equipment";
import { equipItem } from "@/domain/equipment";
import type {
  ArmorCategory,
  DamageType,
  InventoryItem,
  WeaponCategory,
  WeaponProperties,
  WeaponRange,
} from "@/domain/inventory";
import { ARMOR_CATEGORIES, DAMAGE_TYPES, WEAPON_CATEGORIES } from "@/domain/inventory";
import { generateId } from "@/domain/id";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionTitle } from "@/components/ui/section-title";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ARMOR_CATEGORY_LABELS } from "@/features/shared/armor-class";
import { EquipControl } from "@/features/shared/equip-control";
import {
  DAMAGE_TYPE_LABELS,
  WEAPON_CATEGORY_LABELS,
  WEAPON_RANGE_LABELS,
} from "@/features/shared/weapon";
import type { CharacterTabProps } from "./types";

function toNumber(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Valeur du sélecteur « Type » : objet simple, catégorie d'armure, ou `weapon-<catégorie>`. */
const PLAIN_ITEM = "none";
const WEAPON_PREFIX = "weapon-";

const DEFAULT_WEAPON: Omit<WeaponProperties, "category"> = {
  range: "melee",
  damageDice: "1d6",
  damageType: "slashing",
};

/** CA de base proposée au choix d'une catégorie (armure de cuir, cuirasse, cotte de mailles,
 * bouclier) — simple point de départ, modifiable ensuite. */
const DEFAULT_BASE_ARMOR_CLASS: Record<ArmorCategory, number> = {
  light: 11,
  medium: 14,
  heavy: 16,
  shield: 2,
};

function optionalNumber(value: string): number | undefined {
  return value ? toNumber(value) : undefined;
}

function createBlankItem(): InventoryItem {
  return { id: generateId(), name: "", quantity: 1 };
}

export function InventoryTab({ draft, onChange }: CharacterTabProps) {
  function updateItem(id: string, patch: Partial<InventoryItem>) {
    onChange({
      inventory: draft.inventory.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    });
  }

  function removeItem(id: string) {
    onChange({ inventory: draft.inventory.filter((item) => item.id !== id) });
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <SectionTitle>Inventaire</SectionTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange({ inventory: [...draft.inventory, createBlankItem()] })}
        >
          <Plus />
          Ajouter un objet
        </Button>
      </div>

      {draft.inventory.length === 0 && (
        <p className="text-muted-foreground text-sm">Aucun objet pour l&rsquo;instant.</p>
      )}

      <div className="grid gap-3">
        {draft.inventory.map((item) => (
          <InventoryRow
            key={item.id}
            item={item}
            character={draft}
            onChange={(patch) => updateItem(item.id, patch)}
            onEquip={(slot) => onChange({ inventory: equipItem(draft, item.id, slot) })}
            onRemove={() => removeItem(item.id)}
          />
        ))}
      </div>
    </div>
  );
}

function InventoryRow({
  item,
  character,
  onChange,
  onEquip,
  onRemove,
}: {
  item: InventoryItem;
  character: Character;
  onChange: (patch: Partial<InventoryItem>) => void;
  onEquip: (slot: EquipSlot) => void;
  onRemove: () => void;
}) {
  const nameId = useId();
  const quantityId = useId();
  const weightId = useId();
  const descriptionId = useId();
  const armorTypeId = useId();
  const baseArmorClassId = useId();
  const strengthId = useId();
  const bonusId = useId();
  const { armor } = item;

  const { weapon } = item;
  const itemType = weapon ? `${WEAPON_PREFIX}${weapon.category}` : (armor?.category ?? PLAIN_ITEM);

  function selectItemType(value: string) {
    if (value === PLAIN_ITEM) {
      onChange({ armor: undefined, weapon: undefined });
      return;
    }
    if (value.startsWith(WEAPON_PREFIX)) {
      const category = value.slice(WEAPON_PREFIX.length) as WeaponCategory;
      onChange({
        armor: undefined,
        armorClassBonus: undefined,
        weapon: { ...DEFAULT_WEAPON, ...weapon, category },
      });
      return;
    }
    const category = value as ArmorCategory;
    onChange({
      weapon: undefined,
      armor: {
        category,
        baseArmorClass:
          armor && armor.category !== "shield" && category !== "shield"
            ? armor.baseArmorClass
            : DEFAULT_BASE_ARMOR_CLASS[category],
        ...(category === "heavy" && armor?.strengthRequirement !== undefined
          ? { strengthRequirement: armor.strengthRequirement }
          : {}),
      },
    });
  }

  return (
    <div className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[2fr_1fr_1fr_minmax(9rem,auto)_auto] sm:items-end">
      <div className="grid gap-1">
        <Label htmlFor={nameId} className="text-muted-foreground text-xs">
          Nom
        </Label>
        <Input
          id={nameId}
          value={item.name}
          onChange={(event) => onChange({ name: event.target.value })}
        />
      </div>
      <div className="grid gap-1">
        <Label htmlFor={quantityId} className="text-muted-foreground text-xs">
          Quantité
        </Label>
        <Input
          id={quantityId}
          type="number"
          min={0}
          value={item.quantity}
          onChange={(event) => onChange({ quantity: toNumber(event.target.value) })}
        />
      </div>
      <div className="grid gap-1">
        <Label htmlFor={weightId} className="text-muted-foreground text-xs">
          Poids
        </Label>
        <Input
          id={weightId}
          type="number"
          min={0}
          step="0.1"
          value={item.weight ?? ""}
          onChange={(event) =>
            onChange({ weight: event.target.value ? toNumber(event.target.value) : undefined })
          }
        />
      </div>
      <EquipControl item={item} character={character} onEquip={onEquip} />
      <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
        <X />
        Retirer
      </Button>
      <div className="grid gap-2 sm:col-span-5 sm:grid-cols-4">
        <div className="grid gap-1">
          <Label htmlFor={armorTypeId} className="text-muted-foreground text-xs">
            Type
          </Label>
          <Select value={itemType} onValueChange={selectItemType}>
            <SelectTrigger id={armorTypeId}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={PLAIN_ITEM}>Objet</SelectItem>
              {ARMOR_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category === "shield" ? "Bouclier" : `Armure ${ARMOR_CATEGORY_LABELS[category]}`}
                </SelectItem>
              ))}
              {WEAPON_CATEGORIES.map((category) => (
                <SelectItem key={category} value={`${WEAPON_PREFIX}${category}`}>
                  Arme {WEAPON_CATEGORY_LABELS[category]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {armor && (
          <div className="grid gap-1">
            <Label htmlFor={baseArmorClassId} className="text-muted-foreground text-xs">
              {armor.category === "shield" ? "Bonus bouclier" : "CA de base"}
            </Label>
            <Input
              id={baseArmorClassId}
              type="number"
              value={armor.baseArmorClass}
              onChange={(event) =>
                onChange({ armor: { ...armor, baseArmorClass: toNumber(event.target.value) } })
              }
            />
          </div>
        )}
        {armor?.category === "heavy" && (
          <div className="grid gap-1">
            <Label htmlFor={strengthId} className="text-muted-foreground text-xs">
              Force min.
            </Label>
            <Input
              id={strengthId}
              type="number"
              min={0}
              value={armor.strengthRequirement ?? ""}
              onChange={(event) =>
                onChange({
                  armor: { ...armor, strengthRequirement: optionalNumber(event.target.value) },
                })
              }
            />
          </div>
        )}
        {!weapon && (
          <div className="grid gap-1">
            <Label htmlFor={bonusId} className="text-muted-foreground text-xs">
              Bonus CA (magique)
            </Label>
            <Input
              id={bonusId}
              type="number"
              value={item.armorClassBonus ?? ""}
              onChange={(event) =>
                onChange({ armorClassBonus: optionalNumber(event.target.value) })
              }
            />
          </div>
        )}
      </div>
      {weapon && <WeaponFields weapon={weapon} onChange={(next) => onChange({ weapon: next })} />}
      <div className="grid gap-1 sm:col-span-5">
        <Label htmlFor={descriptionId} className="text-muted-foreground text-xs">
          Description
        </Label>
        <Input
          id={descriptionId}
          value={item.description ?? ""}
          onChange={(event) => onChange({ description: event.target.value || undefined })}
        />
      </div>
    </div>
  );
}

function WeaponFields({
  weapon,
  onChange,
}: {
  weapon: WeaponProperties;
  onChange: (weapon: WeaponProperties) => void;
}) {
  const rangeId = useId();
  const diceId = useId();
  const versatileId = useId();
  const damageTypeId = useId();
  const finesseId = useId();
  const magicId = useId();
  const thrownNormalId = useId();
  const thrownLongId = useId();
  const { thrown } = weapon;

  function update(patch: Partial<WeaponProperties>) {
    onChange({ ...weapon, ...patch });
  }

  return (
    <>
      <div className="grid gap-2 sm:col-span-5 sm:grid-cols-[1.5fr_1fr_1fr_1.5fr_auto_1fr] sm:items-end">
        <div className="grid gap-1">
          <Label htmlFor={rangeId} className="text-muted-foreground text-xs">
            Portée
          </Label>
          <Select
            value={weapon.range}
            onValueChange={(value) => update({ range: value as WeaponRange })}
          >
            <SelectTrigger id={rangeId}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(WEAPON_RANGE_LABELS) as WeaponRange[]).map((range) => (
                <SelectItem key={range} value={range}>
                  {WEAPON_RANGE_LABELS[range]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1">
          <Label htmlFor={diceId} className="text-muted-foreground text-xs">
            Dégâts
          </Label>
          <Input
            id={diceId}
            value={weapon.damageDice}
            placeholder="1d8"
            aria-invalid={!isValidDamageDice(weapon.damageDice)}
            onChange={(event) => update({ damageDice: event.target.value.trim() })}
          />
        </div>
        <div className="grid gap-1">
          <Label htmlFor={versatileId} className="text-muted-foreground text-xs">
            À deux mains
          </Label>
          <Input
            id={versatileId}
            value={weapon.versatileDamageDice ?? ""}
            placeholder="—"
            aria-invalid={
              weapon.versatileDamageDice !== undefined &&
              !isValidDamageDice(weapon.versatileDamageDice)
            }
            onChange={(event) =>
              update({ versatileDamageDice: event.target.value.trim() || undefined })
            }
          />
        </div>
        <div className="grid gap-1">
          <Label htmlFor={damageTypeId} className="text-muted-foreground text-xs">
            Type de dégâts
          </Label>
          <Select
            value={weapon.damageType}
            onValueChange={(value) => update({ damageType: value as DamageType })}
          >
            <SelectTrigger id={damageTypeId}>
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
        <div className="flex h-9 items-center gap-2">
          <Switch
            id={finesseId}
            checked={weapon.finesse ?? false}
            onCheckedChange={(checked) => update({ finesse: checked || undefined })}
          />
          <Label htmlFor={finesseId} className="text-muted-foreground text-xs">
            Finesse
          </Label>
        </div>
        <div className="grid gap-1">
          <Label htmlFor={magicId} className="text-muted-foreground text-xs">
            Bonus magique
          </Label>
          <Input
            id={magicId}
            type="number"
            value={weapon.magicBonus ?? ""}
            onChange={(event) => update({ magicBonus: optionalNumber(event.target.value) })}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-x-6 gap-y-2 sm:col-span-5">
        <PropertySwitch
          label="Deux mains"
          checked={weapon.twoHanded ?? false}
          onCheckedChange={(checked) =>
            update({ twoHanded: checked || undefined, ...(checked ? { light: undefined } : {}) })
          }
        />
        {!weapon.twoHanded && weapon.range === "melee" && (
          <PropertySwitch
            label="Légère"
            checked={weapon.light ?? false}
            onCheckedChange={(checked) => update({ light: checked || undefined })}
          />
        )}
        {weapon.range === "melee" && (
          <PropertySwitch
            label="Lancer"
            checked={weapon.thrown !== undefined}
            onCheckedChange={(checked) =>
              update({ thrown: checked ? { normal: 6, long: 18 } : undefined })
            }
          />
        )}
        {weapon.range === "melee" && thrown && (
          <div className="flex items-end gap-2">
            <div className="grid gap-1">
              <Label htmlFor={thrownNormalId} className="text-muted-foreground text-xs">
                Portée (m)
              </Label>
              <Input
                id={thrownNormalId}
                type="number"
                min={0}
                className="w-20"
                value={thrown.normal}
                onChange={(event) =>
                  update({
                    thrown: { ...thrown, normal: toNumber(event.target.value) },
                  })
                }
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor={thrownLongId} className="text-muted-foreground text-xs">
                Longue (m)
              </Label>
              <Input
                id={thrownLongId}
                type="number"
                min={0}
                className="w-20"
                value={thrown.long}
                onChange={(event) =>
                  update({ thrown: { ...thrown, long: toNumber(event.target.value) } })
                }
              />
            </div>
          </div>
        )}
        {weapon.category === "martial" && weapon.range === "melee" && (
          <PropertySwitch
            label="Arme de moine (coutelas)"
            checked={weapon.monkWeapon ?? false}
            onCheckedChange={(checked) => update({ monkWeapon: checked || undefined })}
          />
        )}
      </div>
    </>
  );
}

function PropertySwitch({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex h-9 items-center gap-2">
      <Switch id={id} checked={checked} onCheckedChange={(value) => onCheckedChange(value)} />
      <Label htmlFor={id} className="text-muted-foreground text-xs">
        {label}
      </Label>
    </div>
  );
}
