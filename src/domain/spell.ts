/**
 * Schéma de sort aligné sur les champs standards republiés par les API ouvertes du SRD (ex :
 * open5e) — voir docs/adr/0004-json-import-export-open5e-schema.md. Aucune donnée de sort n'est
 * bundlée dans ce repo : ce type ne décrit que la forme attendue des sorts importés par
 * l'utilisateur.
 */
export interface SpellComponents {
  verbal: boolean;
  somatic: boolean;
  material: boolean;
  materialDescription?: string;
}

export interface Spell {
  id: string;
  name: string;
  /** 0 = cantrip (tour de magie) */
  level: number;
  school: string;
  castingTime: string;
  range: string;
  components: SpellComponents;
  duration: string;
  concentration: boolean;
  ritual: boolean;
  description: string;
  higherLevel?: string;
  classes: string[];
  source?: string;
}
