"use client";

import type { Character, DeathSaves } from "@/domain/character";
import { adjustFeatureUses } from "@/domain/calculations/feature-uses";
import {
  DEATH_SAVE_OUTCOME_LABELS,
  deathSaveOutcome,
  reconcileDeathSaves,
  rollDeathSave,
  setDeathSaves,
  stabilize,
} from "@/domain/calculations/death-saves";
import { setTemporaryHitPoints } from "@/domain/calculations/hit-points";
import { applyLongRest, applyShortRest } from "@/domain/calculations/rest";
import { setExhaustion } from "@/domain/calculations/exhaustion-change";
import type { EquipSlot, WeaponPlacement } from "@/domain/equipment";
import { equipItem, placeWeapon } from "@/domain/equipment";
import type { Coin } from "@/domain/currency";
import { characterCurrency, setCoinAmount } from "@/domain/currency";
import { adjustItemQuantity } from "@/domain/inventory";
import type { CastingPatch, CastMode } from "@/domain/calculations/spell-casting";
import { castSpell } from "@/domain/calculations/spell-casting";
import type { SpellPreparationState } from "@/domain/calculations/spell-preparation";
import { setSpellPreparation } from "@/domain/calculations/spell-preparation";
import { adjustSpellSlotsUsed } from "@/domain/calculations/spell-slot-table";
import type { Spell } from "@/domain/spell";
import { adjustClassResourceUsed } from "@/domain/calculations/class-resources";
import { endRage, startRage } from "@/domain/calculations/rage";
import {
  endWildShape,
  healInPlay,
  setHitPointsInPlay,
  startWildShape,
  takeDamage,
} from "@/domain/calculations/wild-shape";
import {
  endSymbioticEntity,
  reconcileSymbioticEntity,
  startSymbioticEntity,
  SYMBIOTIC_ENTITY_OPTION_ID,
} from "@/domain/calculations/circle-of-spores";
import {
  endShillelagh,
  reconcileShillelagh,
  startShillelagh,
} from "@/domain/calculations/shillelagh";
import type { ClassResourceId } from "@/domain/character-class";
import type { ActivityIntent } from "@/domain/activity-log";
import { buildActivityEntry } from "@/domain/activity-log";
import { describeChanges } from "@/domain/calculations/activity-changes";
import { generateId } from "@/domain/id";
import type { JournalSession } from "@/domain/journal";
import {
  addNote,
  createSession,
  deleteNote,
  deleteSession,
  localDateKey,
  updateNote,
  updateSession,
} from "@/domain/journal";
import {
  useActivityLogStoreApi,
  useCharacterStoreApi,
  useSpellStoreApi,
} from "@/stores/store-provider";

/**
 * Actions du mode jeu : persistent immédiatement (pas de brouillon + bouton Enregistrer, à
 * l'inverse du mode configuration — voir docs/adr/0013). Chaque action relit l'état courant via
 * `characterStore.getState()` au moment de l'appel plutôt qu'une valeur de rendu fermée, pour
 * éviter qu'un double-clic rapide (ex : deux dégâts coup sur coup) ne perde une mise à jour à
 * cause d'une closure périmée.
 */
export function usePlayActions(characterId: string) {
  const characterStore = useCharacterStoreApi();
  const activityLogStore = useActivityLogStoreApi();
  const spellStore = useSpellStoreApi();

  /**
   * Applique une action et l'inscrit dans l'historique (docs/adr/0061) : ce qui a changé sur la
   * fiche, et le contexte de l'action (`intent`) quand elle en a un. Une action sans effet ni
   * contexte n'est pas inscrite. L'historique n'est jamais attendu : il ne ralentit pas le jeu.
   */
  function withCurrent(
    mutate: (character: Character) => Partial<Character>,
    intent?: ActivityIntent,
  ) {
    const current = characterStore
      .getState()
      .characters.find((character) => character.id === characterId);
    if (!current) {
      return;
    }
    // Toute remontée (ou chute) des PV remet les jets contre la mort à zéro (docs/adr/0060).
    // Une arme lâchée met fin à Gourdin magique (docs/adr/0068), la perte des PV temporaires à
    // l'Entité symbiotique (docs/adr/0069).
    const patch = reconcileSymbioticEntity(
      current,
      reconcileShillelagh(current, reconcileDeathSaves(current, mutate(current))),
    );
    const next = { ...current, ...patch };
    const changes = describeChanges(current, next, {
      spellName: (spellId) =>
        spellStore.getState().spells.find((spell) => spell.id === spellId)?.name,
    });
    const entry = buildActivityEntry(changes, intent, {
      id: generateId(),
      at: new Date().toISOString(),
    });
    if (entry) {
      void activityLogStore.getState().record(characterId, entry);
    }
    return characterStore.getState().update(characterId, next);
  }

  return {
    /** Inscrit une action sans effet sur la fiche (ex : une attaque, docs/adr/0062). */
    logActivity: (intent: ActivityIntent) => {
      const entry = buildActivityEntry([], intent, {
        id: generateId(),
        at: new Date().toISOString(),
      });
      return entry ? activityLogStore.getState().record(characterId, entry) : Promise.resolve();
    },
    // En Forme sauvage, dégâts et soins vont aux PV de la bête (docs/adr/0070).
    applyDamage: (amount: number) => withCurrent((character) => takeDamage(character, amount)),
    applyHealing: (amount: number) => withCurrent((character) => healInPlay(character, amount)),
    setCurrentHitPoints: (value: number) =>
      withCurrent((character) => setHitPointsInPlay(character, value)),
    startWildShape: (formId: string) =>
      withCurrent((character) => startWildShape(character, formId), {
        title: "Forme sauvage",
        category: "status",
      }),
    toggleWildShapeFavorite: (formId: string) =>
      withCurrent((character) => ({
        wildShapeForms: character.wildShapeForms?.map((form) =>
          form.id === formId ? { ...form, favorite: form.favorite ? undefined : true } : form,
        ),
      })),
    endWildShape: () =>
      withCurrent(() => endWildShape(), { title: "Retour à la forme normale", category: "status" }),
    setTemporaryHitPoints: (amount: number) =>
      withCurrent((character) => ({
        hitPoints: setTemporaryHitPoints(character.hitPoints, amount),
      })),
    toggleConcentration: () =>
      withCurrent((character) => ({
        // Couper la concentration oublie aussi le sort concentré (et donc ses effets de CA).
        concentration: character.concentration.active
          ? { active: false }
          : { ...character.concentration, active: true },
      })),
    setConcentrationSpell: (spellId: string | undefined) =>
      withCurrent((character) => ({
        concentration: spellId
          ? { ...character.concentration, spellId }
          : { active: character.concentration.active },
      })),
    toggleArmorClassEffect: (effectId: string) =>
      withCurrent((character) => ({
        armorClassEffects: character.armorClassEffects?.map((effect) =>
          effect.id === effectId && effect.trigger.type === "manual"
            ? { ...effect, trigger: { type: "manual", active: !effect.trigger.active } }
            : effect,
        ),
      })),
    /** Repos court, avec les jets des dés de vie dépensés (un par dé). */
    takeShortRest: (hitDieRolls: readonly number[] = [], keepConcentration = false) =>
      withCurrent((character) => applyShortRest(character, hitDieRolls, { keepConcentration }), {
        title: "Repos court",
        category: "rest",
        ...(hitDieRolls.length > 0
          ? { details: [`Dés de vie lancés : ${hitDieRolls.join(", ")}`] }
          : {}),
      }),
    takeLongRest: (ateAndDrank = true) =>
      withCurrent((character) => applyLongRest(character, { ateAndDrank }), {
        title: "Repos long",
        category: "rest",
      }),
    setExhaustion: (level: number) => withCurrent((character) => setExhaustion(character, level)),
    rollDeathSave: (roll: number) =>
      withCurrent((character) => rollDeathSave(character, roll), {
        title: `Jet contre la mort : ${roll}`,
        category: "status",
        details: [DEATH_SAVE_OUTCOME_LABELS[deathSaveOutcome(roll)]],
      }),
    setDeathSaves: (deathSaves: DeathSaves) => withCurrent(() => setDeathSaves(deathSaves)),
    stabilize: () =>
      withCurrent((character) => stabilize(character), { title: "Stabilisé", category: "status" }),
    setSpellPreparation: (spellId: string, state: SpellPreparationState) =>
      withCurrent((character) => setSpellPreparation(character, spellId, state)),
    /** Lance un sort et renvoie l'état d'avant (emplacements + concentration), pour « Annuler ». */
    castSpell: (spell: Spell, mode: CastMode): CastingPatch | undefined => {
      const current = characterStore
        .getState()
        .characters.find((character) => character.id === characterId);
      if (!current) {
        return undefined;
      }
      const previous: CastingPatch = {
        spellSlotsUsed: current.spellSlotsUsed,
        concentration: current.concentration,
        shillelagh: current.shillelagh,
      };
      const how =
        mode.type === "ritual"
          ? " (rituel)"
          : mode.type === "slot" && mode.level > spell.level
            ? ` (niv. ${mode.level})`
            : "";
      void withCurrent((character) => castSpell(character, spell, mode), {
        title: `${spell.name}${how} lancé`,
        category: "spells",
      });
      return previous;
    },
    restoreCasting: (previous: CastingPatch) =>
      withCurrent(() => previous, { title: "Lancement annulé", category: "spells" }),
    equipItem: (itemId: string, slot: EquipSlot) =>
      withCurrent((character) => ({ inventory: equipItem(character, itemId, slot) })),
    startRage: () =>
      withCurrent((character) => startRage(character), {
        title: "Entrée en rage",
        category: "status",
      }),
    endRage: () => withCurrent(() => endRage(), { title: "Fin de la rage", category: "status" }),
    startShillelagh: (itemId: string) =>
      withCurrent((character) => startShillelagh(character, itemId), {
        title: "Gourdin magique lancé",
        category: "spells",
      }),
    endShillelagh: () =>
      withCurrent(() => endShillelagh(), { title: "Fin de Gourdin magique", category: "spells" }),
    placeWeapon: (itemId: string, placement: WeaponPlacement) =>
      withCurrent((character) => ({ inventory: placeWeapon(character, itemId, placement) })),
    adjustItemQuantity: (itemId: string, delta: number) =>
      withCurrent((character) => ({
        inventory: adjustItemQuantity(character.inventory, itemId, delta),
      })),
    setCoinAmount: (coin: Coin, amount: number) =>
      withCurrent((character) => ({
        currency: setCoinAmount(characterCurrency(character), coin, amount),
      })),
    adjustFeatureUse: (featureId: string, delta: number) =>
      withCurrent((character) => ({
        features: character.features.map((feature) =>
          feature.id === featureId ? adjustFeatureUses(feature, delta) : feature,
        ),
      })),
    adjustSpellSlot: (level: number, delta: number) =>
      withCurrent((character) => ({
        spellSlotsUsed: adjustSpellSlotsUsed(character, level, delta),
      })),
    /** Utilise une option de ressource de classe : l'Entité symbiotique s'active (docs/adr/0069),
     * les autres dépensent simplement une utilisation. */
    applyResourceOption: (resourceId: ClassResourceId, optionKey: string) =>
      optionKey === SYMBIOTIC_ENTITY_OPTION_ID
        ? withCurrent((character) => startSymbioticEntity(character), {
            title: "Entité symbiotique",
            category: "status",
          })
        : withCurrent((character) => ({
            classResourcesUsed: adjustClassResourceUsed(character, resourceId, 1),
          })),
    endSymbioticEntity: () =>
      withCurrent(() => endSymbioticEntity(), {
        title: "Fin de l’Entité symbiotique",
        category: "status",
      }),
    /** `delta` > 0 dépense des utilisations, < 0 en récupère. */
    adjustClassResource: (resourceId: ClassResourceId, delta: number) =>
      withCurrent((character) => ({
        classResourcesUsed: adjustClassResourceUsed(character, resourceId, delta),
      })),
    // Journal de l'aventurier (docs/adr/0071) : hors historique, ce ne sont pas des actions de jeu.
    /** Sans `sessionId`, la note va dans la session du jour, créée à la volée. */
    addJournalNote: (text: string, sessionId?: string) =>
      withJournal((journal) =>
        addNote(
          journal,
          text,
          sessionId
            ? { sessionId }
            : { today: localDateKey(new Date()), newSessionId: generateId() },
          { id: generateId(), now: new Date().toISOString() },
        ),
      ),
    /** Crée une session et renvoie son identifiant. */
    createJournalSession: (values: { date: string; title?: string }) => {
      const id = generateId();
      void withJournal((journal) =>
        createSession(journal, values, { id, now: new Date().toISOString() }),
      );
      return id;
    },
    updateJournalSession: (sessionId: string, values: { date: string; title?: string }) =>
      withJournal((journal) => updateSession(journal, sessionId, values)),
    deleteJournalSession: (sessionId: string) =>
      withJournal((journal) => deleteSession(journal, sessionId)),
    updateJournalNote: (noteId: string, text: string) =>
      withJournal((journal) => updateNote(journal, noteId, text)),
    deleteJournalNote: (noteId: string) => withJournal((journal) => deleteNote(journal, noteId)),
  };

  function withJournal(mutate: (journal: JournalSession[]) => JournalSession[]) {
    return withCurrent((character) => ({ journal: mutate(character.journal ?? []) }));
  }
}
