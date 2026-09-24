"use client";

import { Footprints, Sparkles, WandSparkles, Zap } from "lucide-react";
import type { Character } from "@/domain/character";
import { computeArmorClass } from "@/domain/calculations/armor-class";
import { effectiveAbilityScores } from "@/domain/calculations/effective-ability-scores";
import { resolvedSpellAttackBonus, resolvedSpellSaveDC } from "@/domain/calculations/spellcasting";
import { computeWeaponAttacks } from "@/domain/calculations/weapon-attack";
import { formatArmorClassBreakdown } from "@/features/shared/armor-class";
import { formatModifier } from "@/features/shared/format";
import { ArmorClassEffectChips, ArmorClassHeading, ArmorClassShield } from "./armor-class-shield";
import { AttackStrip } from "./attack-strip";
import { ConcentrationMarker } from "./concentration-marker";
import { HitPointsControls, HitPointsRing, TemporaryHitPointsChip } from "./hit-points-ring";
import { RestActions } from "./rest-actions";
import { StatTile } from "./stat-tile";

/** Un effet de CA temporaire est-il actif (interrupteur manuel, ou sort concentré en cours) ? */
function hasActiveArmorClassEffect(character: Character): boolean {
  return (character.armorClassEffects ?? []).some((effect) =>
    effect.trigger.type === "manual"
      ? effect.trigger.active
      : character.concentration.active &&
        character.concentration.spellId === effect.trigger.spellId,
  );
}

/**
 * HUD de combat du mode jeu, toujours visible au-dessus des onglets : CA (prioritaire), PV, valeurs
 * de combat et d'incantation, attaques, concentration et repos. Voir docs/adr/0021.
 *
 * Bouclier CA et anneau PV partagent les lignes d'une même grille (libellé/contrôles, visuel de même
 * hauteur, pastilles) pour rester alignés ; sur desktop les tuiles occupent une 3e colonne centrée
 * sur la ligne des visuels, sur mobile elles passent sous le détail de la CA.
 */
export function CombatHud({ character }: { character: Character }) {
  const armorClass = computeArmorClass(character);
  const attacks = computeWeaponAttacks(character);
  const { spellcasting } = character;
  const castingScore = spellcasting
    ? effectiveAbilityScores(character.abilityScores, character.raceSelection)[spellcasting.ability]
    : undefined;

  return (
    <section
      aria-label="Combat"
      className="bg-background/50 flex flex-col gap-5 rounded-2xl border px-3 pt-5 pb-4 sm:gap-6 sm:px-7 sm:pt-7 sm:pb-5"
    >
      <div className="grid grid-cols-2 grid-rows-[40px_140px_auto] items-center justify-items-center gap-x-2 gap-y-3 sm:grid-cols-[170px_minmax(0,1fr)_216px] sm:grid-rows-[40px_188px_auto_auto] sm:gap-x-5 sm:gap-y-3.5">
        <div className="col-start-1 row-start-1">
          <ArmorClassHeading />
        </div>
        <div className="col-start-2 row-start-1">
          <HitPointsControls character={character} />
        </div>

        <div className="col-start-1 row-start-2">
          <ArmorClassShield
            armorClass={armorClass}
            boosted={hasActiveArmorClassEffect(character)}
          />
        </div>
        <div className="col-start-2 row-start-2">
          <HitPointsRing character={character} />
        </div>

        <div className="col-start-1 row-start-3 max-w-full">
          <ArmorClassEffectChips character={character} />
        </div>
        <div className="col-start-2 row-start-3">
          <TemporaryHitPointsChip character={character} />
        </div>

        <p className="text-muted-foreground col-span-2 col-start-1 row-start-4 text-center text-xs sm:col-span-1">
          {formatArmorClassBreakdown(armorClass)}
        </p>

        <div
          className={`col-span-2 col-start-1 row-start-5 grid w-full gap-1.5 sm:col-span-1 sm:col-start-3 sm:row-start-2 sm:gap-2.5 ${
            spellcasting ? "grid-cols-4 sm:grid-cols-2" : "grid-cols-2"
          }`}
        >
          <StatTile
            icon={Zap}
            value={formatModifier(character.initiativeBonus)}
            label="Initiative"
          />
          <StatTile
            icon={Footprints}
            value={
              <>
                {character.speed}
                <span className="text-muted-foreground text-sm font-semibold"> m</span>
              </>
            }
            label="Vitesse"
          />
          {spellcasting && castingScore !== undefined && (
            <>
              <StatTile
                icon={Sparkles}
                tone="magic"
                value={resolvedSpellSaveDC(
                  character.level,
                  castingScore,
                  spellcasting.spellSaveDCOverride,
                )}
                label="DD sorts"
              />
              <StatTile
                icon={WandSparkles}
                tone="magic"
                value={formatModifier(
                  resolvedSpellAttackBonus(
                    character.level,
                    castingScore,
                    spellcasting.spellAttackBonusOverride,
                  ),
                )}
                label="Attaque sort"
              />
            </>
          )}
        </div>
      </div>

      {attacks.length > 0 && (
        <div className="border-t pt-4 sm:pt-5">
          <AttackStrip attacks={attacks} />
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3 border-t pt-4">
        <ConcentrationMarker character={character} />
        <RestActions characterId={character.id} />
      </div>
    </section>
  );
}
