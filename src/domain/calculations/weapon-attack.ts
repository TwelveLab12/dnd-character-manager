import type { AbilityName } from "../ability-scores";
import type { Character } from "../character";
import { canWieldOffHand, weaponGrip } from "../equipment";
import type {
  DamageType,
  InventoryItem,
  ThrownRange,
  WeaponProperties,
  WeaponRange,
} from "../inventory";
import { rageDamageBonus } from "../character-class";
import { isReadyWeapon } from "../inventory";
import { effectiveAbilityScores } from "./effective-ability-scores";
import { abilityModifier } from "./modifiers";
import { clampCharacterLevel, proficiencyBonusForLevel } from "./proficiency";
import { effectiveWeaponProficiencies, hasMartialArts } from "./class-features";

const DICE_PATTERN = /^(\d+)d(\d+)$/;

export const UNARMED_STRIKE_ID = "unarmed-strike";

/** Terme d'un jet (caractéristique, maîtrise, magie, Rage…), avec la règle qui l'explique. */
export interface RollTerm {
  label: string;
  value: number;
  reason: string;
}

export interface WeaponAttack {
  itemId: string;
  name: string;
  range: WeaponRange;
  ability: AbilityName;
  proficient: boolean;
  attackBonus: number;
  /** Ex : « 1d8+3 », « 1d6-1 », « 2d6 ». */
  damage: string;
  /** Dégâts à deux mains d'une arme polyvalente prête, dont la prise n'est pas encore choisie —
   * absent si la main secondaire est occupée (bouclier ou arme). Une arme en main n'a que ses
   * dégâts de prise, dans `damage` (docs/adr/0057). */
  versatileDamage?: string;
  damageType: DamageType;
  /** Tenue à deux mains : arme à deux mains, ou polyvalente tenue à deux mains. */
  twoHanded: boolean;
  thrown?: ThrownRange;
  /** Arts martiaux appliqués à cette attaque (arme de moine ou mains nues). */
  martialArts: boolean;
  /** Arme en main secondaire : attaque en action bonus (combat à deux armes). */
  offHand: boolean;
  /** Bonus de Rage inclus dans les dégâts (corps à corps avec la Force, en rage). */
  rageBonus?: number;
  /** Dés de dégâts réellement lancés (ex : « 1d10 » à deux mains, dé d'Arts martiaux). */
  damageDice: string;
  /** Décomposition du bonus au toucher (docs/adr/0062) : leur somme vaut `attackBonus`. */
  attackTerms: RollTerm[];
  /** Décomposition du modificateur de dégâts ajouté aux dés. */
  damageTerms: RollTerm[];
  /** Règles appliquées au toucher sans terme chiffré (ex : arme non maîtrisée). */
  attackNotes: string[];
  /** Règles appliquées aux dégâts sans terme chiffré (dé à deux mains, main secondaire…). */
  damageNotes: string[];
}

/** Dés valides au format « NdM » (ex : 1d8, 2d6), sans modificateur. */
export function isValidDamageDice(dice: string): boolean {
  return DICE_PATTERN.test(dice.trim());
}

/** Moyenne d'un jet « NdM », `undefined` si le format est invalide. */
function averageRoll(dice: string): number | undefined {
  const match = DICE_PATTERN.exec(dice.trim());
  if (!match) {
    return undefined;
  }
  const count = Number(match[1]);
  const faces = Number(match[2]);
  return (count * (faces + 1)) / 2;
}

/** Formule de dégâts « 1d8+3 » : le modificateur est omis quand il vaut 0. */
export function formatDamage(dice: string, modifier: number): string {
  const base = dice.trim();
  if (modifier === 0) {
    return base;
  }
  return `${base}${modifier > 0 ? "+" : "-"}${Math.abs(modifier)}`;
}

/** Dé d'Arts martiaux du Moine (2014) : d4, d6 au niveau 5, d8 au 11, d10 au 17. */
export function martialArtsDie(level: number): string {
  const clamped = clampCharacterLevel(level);
  if (clamped >= 17) return "1d10";
  if (clamped >= 11) return "1d8";
  if (clamped >= 5) return "1d6";
  return "1d4";
}

/** Arme de moine (2014) : coutelas (case explicite) ou arme courante de corps à corps qui n'est
 * pas à deux mains (les armes lourdes sont toutes de guerre). */
export function isMonkWeapon(weapon: WeaponProperties): boolean {
  return (
    weapon.monkWeapon === true ||
    (weapon.category === "simple" && weapon.range === "melee" && !weapon.twoHanded)
  );
}

function equippedArmorItems(character: Character): { armor: boolean; shield: boolean } {
  const equipped = character.inventory.filter((item) => item.equipped === true && item.armor);
  return {
    armor: equipped.some((item) => item.armor?.category !== "shield"),
    shield: equipped.some((item) => item.armor?.category === "shield"),
  };
}

function hasOffHandWeapon(character: Character): boolean {
  return character.inventory.some(
    (item) => item.equipped === true && item.weapon && item.hand === "off",
  );
}

/** Arts martiaux actifs : interrupteur activé et ni armure ni bouclier équipés. */
export function isMartialArtsActive(character: Character): boolean {
  if (!hasMartialArts(character)) {
    return false;
  }
  const { armor, shield } = equippedArmorItems(character);
  return !armor && !shield;
}

interface AttackContext {
  strength: number;
  dexterity: number;
  proficiencyBonus: number;
  /** Main secondaire occupée (bouclier ou arme) : pas d'usage à deux mains d'une polyvalente. */
  offHandBusy: boolean;
  twoWeaponFightingStyle: boolean;
  martialArtsActive: boolean;
  martialArtsDie: string;
  /** Bonus aux dégâts de la Rage, 0 hors rage (docs/adr/0055). */
  rageBonus: number;
}

function attackContext(character: Character): AttackContext {
  const scores = effectiveAbilityScores(character.abilityScores, character.raceSelection);
  return {
    strength: abilityModifier(scores.strength),
    dexterity: abilityModifier(scores.dexterity),
    proficiencyBonus: proficiencyBonusForLevel(clampCharacterLevel(character.level)),
    offHandBusy: equippedArmorItems(character).shield || hasOffHandWeapon(character),
    twoWeaponFightingStyle: character.twoWeaponFightingStyle === true,
    martialArtsActive: isMartialArtsActive(character),
    martialArtsDie: martialArtsDie(character.level),
    rageBonus: character.raging ? rageDamageBonus(clampCharacterLevel(character.level)) : 0,
  };
}

function bestOf(context: AttackContext): AbilityName {
  return context.dexterity > context.strength ? "dexterity" : "strength";
}

/** Garde le dé de l'arme, sauf si le dé d'Arts martiaux est strictement meilleur en moyenne. */
function betterDice(weaponDice: string, martialDie: string): string {
  const weaponAverage = averageRoll(weaponDice);
  const martialAverage = averageRoll(martialDie) ?? 0;
  return weaponAverage !== undefined && weaponAverage >= martialAverage ? weaponDice : martialDie;
}

const ABILITY_NAMES: Record<"strength" | "dexterity", string> = {
  strength: "Force",
  dexterity: "Dextérité",
};

const CATEGORY_NAMES: Record<WeaponProperties["category"], string> = {
  simple: "armes courantes",
  martial: "armes de guerre",
};

function abilityReason(
  weapon: WeaponProperties,
  ability: AbilityName,
  martialArts: boolean,
): string {
  if (martialArts) {
    return "Arts martiaux : la meilleure de Force et Dextérité.";
  }
  if (weapon.finesse) {
    return "Finesse : la meilleure de Force et Dextérité.";
  }
  if (weapon.range === "ranged") {
    return "Arme à distance : Dextérité.";
  }
  return weapon.thrown
    ? "Arme de corps à corps, même lancée : Force."
    : `Arme de corps à corps : ${ABILITY_NAMES[ability as "strength"]}.`;
}

function buildWeaponAttack(
  character: Character,
  item: InventoryItem,
  weapon: WeaponProperties,
  context: AttackContext,
): WeaponAttack {
  const monkWeapon = isMonkWeapon(weapon);
  const martialArts = context.martialArtsActive && monkWeapon;

  let ability: AbilityName = weapon.range === "ranged" ? "dexterity" : "strength";
  if (weapon.finesse || martialArts) {
    ability = bestOf(context);
  }
  const modifier = ability === "dexterity" ? context.dexterity : context.strength;

  // Le Moine maîtrise les armes courantes et le coutelas : toute arme de moine compte comme
  // maîtrisée dès que les Arts martiaux sont cochés, même s'ils sont inactifs (armure portée).
  const proficient =
    effectiveWeaponProficiencies(character).includes(weapon.category) ||
    (hasMartialArts(character) && monkWeapon);
  const magicBonus = weapon.magicBonus ?? 0;
  const offHand = item.hand === "off";
  // Prise choisie (docs/adr/0057) : seule une arme en main a une prise ; une arme prête garde
  // ses deux dégâts de polyvalente.
  const equipped = item.equipped === true;
  const versatileGrip =
    equipped && !weapon.twoHanded && weaponGrip(character, weapon, item.hand) === "both";
  // Main secondaire (2014) : pas de mod positif aux dégâts, sauf style Combat à deux armes.
  const abilityDamage =
    offHand && !context.twoWeaponFightingStyle ? Math.min(modifier, 0) : modifier;
  // Rage : attaques d'arme de corps à corps utilisant la Force.
  const rageBonus = weapon.range === "melee" && ability === "strength" ? context.rageBonus : 0;
  const damageModifier = abilityDamage + magicBonus + rageBonus;
  const baseDice =
    versatileGrip && weapon.versatileDamageDice ? weapon.versatileDamageDice : weapon.damageDice;
  const damageDice = martialArts ? betterDice(baseDice, context.martialArtsDie) : baseDice;

  const abilityName = ABILITY_NAMES[ability as "strength" | "dexterity"];
  const reason = abilityReason(weapon, ability, martialArts);
  const magicTerm: RollTerm[] =
    magicBonus !== 0
      ? [
          {
            label: "Arme magique",
            value: magicBonus,
            reason: `Arme ${formatSigned(magicBonus)} : au toucher et aux dégâts.`,
          },
        ]
      : [];
  const attackTerms: RollTerm[] = [
    { label: abilityName, value: modifier, reason: `Modificateur de ${abilityName}. ${reason}` },
    ...(proficient
      ? [
          {
            label: "Maîtrise",
            value: context.proficiencyBonus,
            reason: effectiveWeaponProficiencies(character).includes(weapon.category)
              ? `Vous maîtrisez les ${CATEGORY_NAMES[weapon.category]} : bonus de maîtrise de votre niveau.`
              : "Moine : les armes de moine sont maîtrisées.",
          },
        ]
      : []),
    ...magicTerm,
  ];
  const offHandDropped = offHand && !context.twoWeaponFightingStyle && modifier > 0;
  const damageTerms: RollTerm[] = [
    ...(offHandDropped
      ? []
      : [
          {
            label: abilityName,
            value: abilityDamage,
            reason:
              offHand && context.twoWeaponFightingStyle
                ? "Style Combat à deux armes : le modificateur s'ajoute aussi en main secondaire."
                : `Modificateur de ${abilityName}, comme au toucher.`,
          },
        ]),
    ...magicTerm,
    ...(rageBonus > 0
      ? [
          {
            label: "Rage",
            value: rageBonus,
            reason: "En rage : bonus aux dégâts des attaques de corps à corps utilisant la Force.",
          },
        ]
      : []),
  ];
  const attackNotes = !proficient
    ? [
        `Arme non maîtrisée (${CATEGORY_NAMES[weapon.category]}) : pas de bonus de maîtrise au toucher.`,
      ]
    : [];
  const damageNotes = [
    ...(proficient ? [proficiencyDamageNote(context.proficiencyBonus)] : []),
    ...(offHandDropped
      ? [
          "Main secondaire : le modificateur de caractéristique ne s'ajoute pas aux dégâts (sauf style Combat à deux armes).",
        ]
      : []),
    ...(versatileGrip
      ? [`Tenue à deux mains (polyvalente) : ${baseDice} au lieu de ${weapon.damageDice}.`]
      : []),
    ...(martialArts && damageDice !== baseDice
      ? [`Arts martiaux : le dé d'Arts martiaux (${damageDice}) remplace celui de l'arme.`]
      : []),
  ];

  return {
    itemId: item.id,
    name: item.name,
    range: weapon.range,
    ability,
    proficient,
    attackBonus: modifier + (proficient ? context.proficiencyBonus : 0) + magicBonus,
    damage: formatDamage(damageDice, damageModifier),
    ...(weapon.versatileDamageDice && !equipped && !context.offHandBusy
      ? { versatileDamage: formatDamage(weapon.versatileDamageDice, damageModifier) }
      : {}),
    damageType: weapon.damageType,
    twoHanded: weapon.twoHanded === true || versatileGrip,
    ...(weapon.thrown && weapon.range === "melee" ? { thrown: weapon.thrown } : {}),
    martialArts,
    offHand,
    ...(rageBonus > 0 ? { rageBonus } : {}),
    damageDice,
    attackTerms,
    damageTerms,
    attackNotes,
    damageNotes,
  };
}

/** Confusion fréquente : la maîtrise aide à toucher, elle n'augmente pas les dégâts. */
function proficiencyDamageNote(proficiencyBonus: number): string {
  return `Le bonus de maîtrise (${formatSigned(proficiencyBonus)}) ne s'ajoute qu'au jet d'attaque, pas aux dégâts.`;
}

function formatSigned(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`;
}

/**
 * Jet d'attaque et dégâts d'une arme (règles 5e 2014) :
 * - caractéristique : Force au corps à corps (et lancer), Dextérité à distance, la meilleure des
 *   deux pour une arme de finesse ou une arme de moine sous Arts martiaux ;
 * - attaque = mod + bonus de maîtrise (si la catégorie courante/de guerre est maîtrisée) + bonus
 *   magique ;
 * - dégâts = dé(s) (ou dé d'Arts martiaux s'il est meilleur) + mod + bonus magique.
 * Retourne `undefined` pour un objet qui n'est pas une arme.
 */
export function computeWeaponAttack(
  character: Character,
  item: InventoryItem,
): WeaponAttack | undefined {
  if (!item.weapon) {
    return undefined;
  }
  return buildWeaponAttack(character, item, item.weapon, attackContext(character));
}

function unarmedStrike(context: AttackContext): WeaponAttack {
  const ability = bestOf(context);
  const modifier = ability === "dexterity" ? context.dexterity : context.strength;
  return {
    itemId: UNARMED_STRIKE_ID,
    name: "Mains nues",
    range: "melee",
    ability,
    proficient: true,
    attackBonus: modifier + context.proficiencyBonus,
    damage: formatDamage(context.martialArtsDie, modifier),
    damageType: "bludgeoning",
    twoHanded: false,
    martialArts: true,
    offHand: false,
    damageDice: context.martialArtsDie,
    attackTerms: [
      {
        label: ABILITY_NAMES[ability as "strength" | "dexterity"],
        value: modifier,
        reason: "Arts martiaux : la meilleure de Force et Dextérité.",
      },
      {
        label: "Maîtrise",
        value: context.proficiencyBonus,
        reason: "Les attaques à mains nues sont toujours maîtrisées.",
      },
    ],
    damageTerms: [
      {
        label: ABILITY_NAMES[ability as "strength" | "dexterity"],
        value: modifier,
        reason: "Modificateur de la caractéristique utilisée au toucher.",
      },
    ],
    attackNotes: [],
    damageNotes: [
      proficiencyDamageNote(context.proficiencyBonus),
      `Arts martiaux : dé de dégâts ${context.martialArtsDie}.`,
    ],
  };
}

/**
 * Attaques des armes équipées, corps à corps d'abord puis distance, dans l'ordre d'inventaire —
 * plus l'attaque à mains nues quand les Arts martiaux sont actifs.
 */
export function computeWeaponAttacks(character: Character): WeaponAttack[] {
  const context = attackContext(character);
  const attacks = character.inventory.flatMap((item) =>
    item.equipped === true && item.weapon
      ? [buildWeaponAttack(character, item, item.weapon, context)]
      : [],
  );
  if (context.martialArtsActive) {
    attacks.push(unarmedStrike(context));
  }
  return [
    ...attacks.filter((attack) => attack.range === "melee"),
    ...attacks.filter((attack) => attack.range === "ranged"),
  ];
}

/** Attaques des armes prêtes à dégainer (docs/adr/0054) : non équipées, non rangées et pas
 * épuisées (quantité > 0), calculées comme en main principale ; corps à corps d'abord, dans l'ordre
 * d'inventaire. */
export function computeReadyWeaponAttacks(character: Character): WeaponAttack[] {
  const context = attackContext(character);
  const attacks = character.inventory.flatMap((item) =>
    item.weapon && isReadyWeapon(item) && item.quantity > 0
      ? [buildWeaponAttack(character, item, item.weapon, context)]
      : [],
  );
  return [
    ...attacks.filter((attack) => attack.range === "melee"),
    ...attacks.filter((attack) => attack.range === "ranged"),
  ];
}

/** Avertissements liés aux armes équipées : deux mains + bouclier, main secondaire non permise,
 * Arts martiaux inactifs. Ces cas ne se produisent plus via equipItem, mais restent possibles
 * sur des données importées ou antérieures. */
export function weaponAttackWarnings(character: Character): string[] {
  const warnings: string[] = [];
  const { armor, shield } = equippedArmorItems(character);

  if (shield) {
    for (const item of character.inventory) {
      if (item.equipped === true && item.weapon?.twoHanded) {
        warnings.push(`${item.name || "Arme"} : arme à deux mains avec un bouclier équipé.`);
      }
    }
  }
  for (const item of character.inventory) {
    if (
      item.equipped === true &&
      item.hand === "off" &&
      item.weapon &&
      !canWieldOffHand(character, item.weapon)
    ) {
      warnings.push(
        `${item.name || "Arme"} : ne peut pas être tenue en main secondaire (arme légère de corps à corps requise, sauf Ambidextre).`,
      );
    }
  }
  if (hasMartialArts(character) && (armor || shield)) {
    warnings.push("Arts martiaux inactifs : une armure ou un bouclier est équipé.");
  }
  return warnings;
}
