/**
 * Jauge de PV en forme de lune, spécifique au thème Séluné (voir hit-points-widget.tsx — les
 * autres thèmes gardent la barre `Progress` linéaire). Le disque représente la lune ; une "marée"
 * claire monte ou descend selon le ratio PV courants/max, un halo apparaît si des PV temporaires
 * sont actifs. Purement présentationnel — les couleurs viennent des tokens du thème actif
 * (var(--foreground)/var(--card)/var(--accent)), pas de valeurs codées en dur, pour rester
 * cohérent si la palette Séluné est retouchée plus tard.
 */
export function MoonHitPointsGauge({
  current,
  max,
  temporary,
}: {
  current: number;
  max: number;
  temporary: number;
}) {
  const ratio = max > 0 ? Math.max(0, Math.min(1, current / max)) : 0;
  const tideY = 6 + (1 - ratio) * 94;
  const isLow = ratio < 0.42;

  return (
    <div className="relative size-28 shrink-0">
      <svg viewBox="0 0 100 100" className="block size-28" aria-hidden="true">
        <defs>
          <clipPath id="moon-hp-disc">
            <circle cx="50" cy="50" r="44" />
          </clipPath>
        </defs>
        <circle
          cx="50"
          cy="50"
          r="44"
          fill="var(--card)"
          stroke="var(--border)"
          strokeWidth="1.5"
        />
        <g clipPath="url(#moon-hp-disc)">
          <rect x="0" y={tideY} width="100" height="94" fill="var(--foreground)" />
          <circle cx="34" cy="40" r="7" fill="var(--background)" opacity="0.08" />
          <circle cx="62" cy="58" r="10" fill="var(--background)" opacity="0.07" />
          <circle cx="57" cy="32" r="4.5" fill="var(--background)" opacity="0.06" />
        </g>
        <circle
          cx="50"
          cy="50"
          r="47"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
          opacity={temporary > 0 ? 1 : 0}
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`font-heading text-3xl leading-none font-semibold ${
            isLow ? "text-foreground" : "text-background"
          }`}
        >
          {current}
        </span>
        <span
          className={`mt-0.5 text-[11px] ${isLow ? "text-muted-foreground" : "text-background/70"}`}
        >
          / {max} PV
        </span>
      </div>
    </div>
  );
}
