import type { Character } from "../character";
import {
  findClassDefinition,
  findSubclassDefinitionByLabel,
  normalizeLabel,
} from "../character-class";
import { effectiveAbilityScores } from "./effective-ability-scores";
import { hasMartialArts } from "./class-features";
import { effectiveSavingThrowProficiencies } from "./combat-stats";
import { computeMaxHitPoints } from "./max-hit-points";
import { abilityModifier } from "./modifiers";
import { clampCharacterLevel } from "./proficiency";

const UNARMORED_DEFENSE_EFFECT_ID = "defense-sans-armure";

function isUnarmoredDefenseEffect(name: string): boolean {
  return normalizeLabel(name).includes("defense sans armure");
}

function withoutEmpty<T>(items: T[]): T[] | undefined {
  return items.length > 0 ? items : undefined;
}

/**
 * Change la classe d'un personnage (docs/adr/0052). Passer d'une classe en texte libre à une
 * classe connue retire ce que les règles calculent désormais, pour ne rien compter deux fois :
 * jets de sauvegarde de la classe cochés à la main, PV max saisis, Arts martiaux cochés, effet de
 * CA « Défense sans armure », bonus de vitesse couvrant le Déplacement sans armure, compteur propre
 * d'une capacité qui porte le nom d'une ressource de classe (ex : « Ki »). L'inverse reporte ces
 * valeurs calculées en saisie manuelle. Entre deux classes connues, seules la classe et la
 * sous-classe changent.
 */
export function changeClass(character: Character, classId: string | undefined): Partial<Character> {
  const current = findClassDefinition(character.classId);
  const target = findClassDefinition(classId);

  if (!target) {
    if (!current) {
      return {};
    }
    const level = clampCharacterLevel(character.level);
    const scores = effectiveAbilityScores(character.abilityScores, character.raceSelection);
    const movement = current.unarmoredMovement?.(level) ?? 0;
    return {
      classId: undefined,
      subclassId: undefined,
      savingThrowProficiencies: effectiveSavingThrowProficiencies(character),
      removedSavingThrowProficiencies: undefined,
      baseMaxHitPoints: computeMaxHitPoints(character).total,
      ...(current.martialArts ? { martialArts: hasMartialArts(character) || undefined } : {}),
      ...(current.unarmoredDefense
        ? {
            armorClassEffects: [
              ...(character.armorClassEffects ?? []),
              {
                id: UNARMORED_DEFENSE_EFFECT_ID,
                name: "Défense sans armure",
                bonus: abilityModifier(scores[current.unarmoredDefense.ability]),
                trigger: { type: "manual" as const, active: true },
              },
            ],
          }
        : {}),
      ...(movement > 0 ? { speedExtraBonus: (character.speedExtraBonus ?? 0) + movement } : {}),
    };
  }
  if (current?.id === target.id) {
    return {};
  }
  if (current) {
    return { classId: target.id, class: target.name, subclassId: undefined, subclass: undefined };
  }

  const level = clampCharacterLevel(character.level);
  const subclass = character.subclass
    ? findSubclassDefinitionByLabel(target.id, character.subclass)
    : undefined;
  const movement = target.unarmoredMovement?.(level) ?? 0;
  const remainingSpeedBonus = (character.speedExtraBonus ?? 0) - movement;
  const resourceNames = target.resources.map((resource) => normalizeLabel(resource.name));

  return {
    classId: target.id,
    class: target.name,
    subclassId: subclass?.id,
    ...(subclass ? { subclass: subclass.name } : {}),
    savingThrowProficiencies: character.savingThrowProficiencies.filter(
      (ability) => !target.savingThrows.includes(ability),
    ),
    baseMaxHitPoints: undefined,
    ...(target.martialArts && character.martialArts === true ? { martialArts: undefined } : {}),
    ...(target.unarmoredDefense && character.armorClassEffects
      ? {
          armorClassEffects: withoutEmpty(
            character.armorClassEffects.filter((effect) => !isUnarmoredDefenseEffect(effect.name)),
          ),
        }
      : {}),
    ...(movement > 0 && character.speedExtraBonus !== undefined
      ? { speedExtraBonus: remainingSpeedBonus > 0 ? remainingSpeedBonus : undefined }
      : {}),
    features: character.features.map((feature) => {
      if (feature.usesMax === undefined || !resourceNames.includes(normalizeLabel(feature.name))) {
        return feature;
      }
      const {
        usesMax: _usesMax,
        usesCurrent: _usesCurrent,
        recharge: _recharge,
        ...rest
      } = feature;
      return rest;
    }),
  };
}
