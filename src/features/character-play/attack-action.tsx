"use client";

import { ChevronDown, Dices, RotateCcw } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useId, useState } from "react";
import type {
  AttackRollResult,
  DamageRollResult,
  RollMode,
} from "@/domain/calculations/attack-roll";
import {
  criticalDice,
  diceRange,
  resolveAttackRoll,
  resolveDamageRoll,
  rollDice,
} from "@/domain/calculations/attack-roll";
import { rollDie } from "@/domain/calculations/hit-dice";
import type { RollTerm, WeaponAttack } from "@/domain/calculations/weapon-attack";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatModifier } from "@/features/shared/format";
import { SegmentedControl } from "@/features/shared/segmented-control";
import { DAMAGE_TYPE_LABELS } from "@/features/shared/weapon";
import { usePlayActions } from "./use-play-actions";

const MODE_REASONS: Record<RollMode, string | undefined> = {
  normal: undefined,
  advantage: "Avantage : on lance deux d20 et on garde le plus haut.",
  disadvantage: "Désavantage : on lance deux d20 et on garde le plus bas.",
};

/**
 * Bloc « Attaquer » du panneau d'une arme (docs/adr/0062) : jet d'attaque puis jet de dégâts, dés
 * lancés par l'application ou saisis, chaque bonus affiché et expliqué (« Pourquoi ? »). La CA de
 * la cible est facultative : sans elle, le joueur indique ce que le MJ annonce. L'attaque terminée
 * est inscrite dans l'historique.
 */
export function AttackAction({
  characterId,
  attack,
}: {
  characterId: string;
  attack: WeaponAttack;
}) {
  const { logActivity } = usePlayActions(characterId);
  const [mode, setMode] = useState<RollMode>("normal");
  const [targetArmorClass, setTargetArmorClass] = useState("");
  const [attackRoll, setAttackRoll] = useState<AttackRollResult>();
  const [answered, setAnswered] = useState<boolean>();
  const [damageRoll, setDamageRoll] = useState<DamageRollResult>();
  const armorClassId = useId();

  const armorClass = parseTarget(targetArmorClass);
  const hit = attackRoll?.hit ?? answered;
  const name = attack.name || "Arme";
  const damageType = DAMAGE_TYPE_LABELS[attack.damageType];

  function rollAttack(dice: number[]) {
    const result = resolveAttackRoll(attack, dice, mode, armorClass);
    setAttackRoll(result);
    setAnswered(undefined);
    setDamageRoll(undefined);
    if (result.hit === false) {
      void logActivity(attackLog(name, result, undefined, damageType));
    }
  }

  function answer(value: boolean) {
    setAnswered(value);
    if (!value && attackRoll) {
      void logActivity(attackLog(name, attackRoll, undefined, damageType));
    }
  }

  function rollDamage(diceTotal: number) {
    if (!attackRoll) {
      return;
    }
    const result = resolveDamageRoll(attack, diceTotal, attackRoll.critical);
    setDamageRoll(result);
    void logActivity(attackLog(name, attackRoll, result, damageType));
  }

  function reset() {
    setAttackRoll(undefined);
    setAnswered(undefined);
    setDamageRoll(undefined);
  }

  const damageDice = attackRoll?.critical ? criticalDice(attack.damageDice) : attack.damageDice;

  return (
    <section
      aria-label="Attaquer"
      className="border-primary/40 bg-primary/5 grid gap-3 rounded-2xl border p-3.5 sm:p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-heading text-lg font-semibold">Attaquer</h3>
        {attackRoll && (
          <Button type="button" variant="ghost" size="sm" onClick={reset}>
            <RotateCcw />
            Nouvelle attaque
          </Button>
        )}
      </div>

      {!attackRoll && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <SegmentedControl<RollMode>
              label="Type de jet"
              className="min-w-0 flex-1"
              options={[
                { value: "disadvantage", label: "Désavantage" },
                { value: "normal", label: "Normal" },
                { value: "advantage", label: "Avantage" },
              ]}
              value={mode}
              onValueChange={setMode}
            />
            <label
              htmlFor={armorClassId}
              className="text-muted-foreground flex items-center gap-2 text-xs"
            >
              CA cible
              <Input
                id={armorClassId}
                type="number"
                inputMode="numeric"
                min={1}
                placeholder="?"
                value={targetArmorClass}
                onChange={(event) => setTargetArmorClass(event.target.value)}
                className="h-9 w-16"
              />
            </label>
          </div>
          <DieEntry
            rollLabel={mode === "normal" ? "Lancer 1d20" : "Lancer 2d20"}
            inputLabel={mode === "normal" ? "ou dé" : "ou dé retenu"}
            min={1}
            max={20}
            onRoll={() =>
              rollAttack(mode === "normal" ? [rollDie(20)] : [rollDie(20), rollDie(20)])
            }
            onEnter={(value) => rollAttack([value])}
          />
          <p className="text-muted-foreground text-xs">
            Bonus au toucher {formatModifier(attack.attackBonus)} : saisissez seulement le résultat
            du d20, l’application ajoute les bonus.
          </p>
        </>
      )}

      {attackRoll && (
        <RollResult
          label="au toucher"
          total={attackRoll.total}
          verdict={attackVerdict(attackRoll, hit)}
          die={{
            label: "d20",
            value: attackRoll.kept,
            discarded: attackRoll.dice.length > 1 ? otherDie(attackRoll) : undefined,
          }}
          terms={attackRoll.terms}
          reasons={[
            ...(attackRoll.dice.length > 1 ? [MODE_REASONS[mode]] : []),
            ...attackRoll.terms.map((term) => term.reason),
            ...attack.attackNotes,
            attackRoll.critical
              ? "20 naturel : coup critique, l’attaque touche quelle que soit la CA."
              : undefined,
            attackRoll.fumble ? "1 naturel : l’attaque rate quelle que soit la CA." : undefined,
            armorClass !== undefined && !attackRoll.critical && !attackRoll.fumble
              ? `Touche si le total atteint la CA de la cible (${armorClass}).`
              : undefined,
          ]}
        />
      )}

      {attackRoll && hit === undefined && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-sm">Annoncez {attackRoll.total} au MJ :</span>
          <Button type="button" size="lg" onClick={() => answer(true)}>
            Touché
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={() => answer(false)}>
            Raté
          </Button>
        </div>
      )}

      {attackRoll && hit === true && !damageRoll && (
        <div className="grid gap-2 border-t pt-3">
          <p className="text-sm font-semibold">
            Dégâts{attackRoll.critical ? " — critique : dés doublés" : ""}
          </p>
          <DieEntry
            rollLabel={`Lancer ${damageDice}`}
            inputLabel="ou total des dés"
            min={diceRange(damageDice)?.min ?? 1}
            max={diceRange(damageDice)?.max ?? 1}
            onRoll={() => rollDamage(rollDice(damageDice).reduce((sum, value) => sum + value, 0))}
            onEnter={rollDamage}
          />
        </div>
      )}

      {damageRoll && (
        <div className="border-t pt-3">
          <RollResult
            label={damageType}
            total={damageRoll.total}
            die={{ label: damageRoll.dice, value: damageRoll.diceTotal }}
            terms={damageRoll.terms}
            reasons={[
              attackRoll?.critical
                ? `Coup critique : les dés sont doublés (${damageRoll.dice}), pas les bonus.`
                : undefined,
              ...damageRoll.terms.map((term) => term.reason),
              ...attack.damageNotes,
            ]}
          />
        </div>
      )}
    </section>
  );
}

function DieEntry({
  rollLabel,
  inputLabel,
  min,
  max,
  onRoll,
  onEnter,
}: {
  rollLabel: string;
  inputLabel: string;
  min: number;
  max: number;
  onRoll: () => void;
  onEnter: (value: number) => void;
}) {
  const [value, setValue] = useState("");
  const inputId = useId();
  const number = Number(value);
  const valid = value !== "" && Number.isInteger(number) && number >= min && number <= max;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (valid) {
      onEnter(number);
      setValue("");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" size="lg" onClick={onRoll}>
        <Dices />
        {rollLabel}
      </Button>
      <form onSubmit={submit} className="flex items-center gap-2">
        <label htmlFor={inputId} className="text-muted-foreground text-xs">
          {inputLabel}
        </label>
        <Input
          id={inputId}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="h-9 w-16"
        />
        <Button type="submit" variant="outline" size="lg" disabled={!valid}>
          Valider
        </Button>
      </form>
    </div>
  );
}

function RollResult({
  label,
  total,
  verdict,
  die,
  terms,
  reasons,
}: {
  label: string;
  total: number;
  verdict?: { text: string; tone: string };
  die: { label: string; value: number; discarded?: number };
  terms: RollTerm[];
  reasons: (string | undefined)[];
}) {
  const [open, setOpen] = useState(false);
  const shownReasons = reasons.filter((reason): reason is string => Boolean(reason));

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-heading text-4xl leading-none font-bold tabular-nums">{total}</span>
        <span className="text-muted-foreground text-sm">{label}</span>
        {verdict && (
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${verdict.tone}`}>
            {verdict.text}
          </span>
        )}
      </div>
      <p aria-label="Détail du calcul" className="flex flex-wrap items-center gap-1.5 text-sm">
        <Chip>
          {die.label} <strong className="tabular-nums">{die.value}</strong>
          {die.discarded !== undefined && (
            <span className="text-muted-foreground tabular-nums line-through">
              {" "}
              {die.discarded}
            </span>
          )}
        </Chip>
        {terms.map((term) => (
          <Chip key={term.label}>
            <strong className="tabular-nums">{formatModifier(term.value)}</strong> {term.label}
          </Chip>
        ))}
        <span className="text-muted-foreground">=</span>
        <strong className="tabular-nums">{total}</strong>
      </p>
      {shownReasons.length > 0 && (
        <div>
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((current) => !current)}
            className="text-primary inline-flex items-center gap-1 text-xs font-medium underline-offset-4 hover:underline"
          >
            Pourquoi ?
            <ChevronDown
              aria-hidden
              className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`}
            />
          </button>
          {open && (
            <ul className="text-muted-foreground mt-1.5 grid list-disc gap-1 pl-5 text-xs">
              {shownReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="bg-background/70 inline-flex items-center gap-1 rounded-lg border px-2 py-0.5">
      {children}
    </span>
  );
}

function parseTarget(value: string): number | undefined {
  const number = Number(value);
  return value !== "" && Number.isInteger(number) && number > 0 ? number : undefined;
}

function otherDie(roll: AttackRollResult): number {
  const index = roll.dice.indexOf(roll.kept);
  return roll.dice[index === 0 ? 1 : 0]!;
}

function attackVerdict(
  roll: AttackRollResult,
  hit: boolean | undefined,
): { text: string; tone: string } | undefined {
  if (roll.critical) {
    return { text: "Coup critique !", tone: "bg-success/15 text-success" };
  }
  if (roll.fumble) {
    return { text: "Échec automatique", tone: "bg-destructive/15 text-destructive" };
  }
  if (hit === true) {
    return { text: "Touché", tone: "bg-success/15 text-success" };
  }
  if (hit === false) {
    return { text: "Raté", tone: "bg-destructive/15 text-destructive" };
  }
  return undefined;
}

function formatTerms(terms: readonly RollTerm[]): string {
  return terms.map((term) => `${formatModifier(term.value)} ${term.label}`).join(" ");
}

function attackLog(
  name: string,
  attack: AttackRollResult,
  damage: DamageRollResult | undefined,
  damageType: string,
) {
  const verdict = attack.critical
    ? " — coup critique"
    : attack.fumble
      ? " — échec automatique"
      : damage
        ? " — touché"
        : " — raté";
  const details = [
    `Jet d’attaque : ${attack.total} (d20 ${attack.kept} ${formatTerms(attack.terms)})${verdict}`,
    ...(damage
      ? [
          `Dégâts : ${damage.total} ${damageType} (${damage.dice} ${damage.diceTotal} ${formatTerms(damage.terms)})`,
        ]
      : []),
  ];
  return { title: `Attaque : ${name}`, category: "combat" as const, details };
}
