# 0008 — Import/export généralisé et sauvegarde complète

**Statut** : Acceptée

## Contexte

L'import de sorts ([0004](0004-json-import-export-open5e-schema.md)) et l'import de personnages
suivent exactement le même besoin (valider chaque ligne indépendamment, classer New/Update/
Identique/Invalide, dédupliquer par id) — les dupliquer aurait doublé la surface à maintenir et à
tester pour un seul et même comportement. Il fallait aussi un mécanisme de sauvegarde complète
(personnages + sorts) pour l'aller-retour entre environnements, distinct dans son usage de l'import
ligne par ligne : un backup est censé être un export généré par cette appli elle-même, pas une
donnée glanée d'une source tierce.

## Décision

- **`src/import-export/preview-import.ts`** : primitive générique `previewImport<T>(rawEntries,
{ schema, existing, fillDefaults?, labelFor? })`, partagée entre sorts et personnages.
  **`parse-import-entries.ts`** : détection générique tableau brut / `{ [clé]: [...] }`.
  **`src/features/shared/import-dialog.tsx`** : dialog générique (coller/fichier → analyser →
  preview → import des lignes valides), configuré différemment pour sorts et personnages plutôt
  que dupliqué.
- **Génération d'id par défaut différente selon l'entité** : les sorts utilisent `slugify(name)`
  (id stable et lisible, cohérent avec les slugs open5e) ; les personnages utilisent un id généré
  aléatoirement (`generateId()`) — deux personnages peuvent légitimement partager le même nom, un
  id dérivé du nom collisionnerait à tort et écraserait l'un avec l'autre à l'import.
- **`backupSchema`** (`{ schemaVersion, exportedAt, characters[], spells[] }`) : validé **en un
  bloc** via `ImportBackupDialog`, sans preview ligne par ligne — contrairement à l'import de sorts/
  personnages qui accepte des données tierces potentiellement partielles, un backup est notre
  propre export et se valide comme un tout cohérent (ids explicites requis, pas de génération par
  défaut à ce niveau).

## Conséquences

Une seule mécanique de validation/preview testée une fois (`preview-import.test.ts`,
`parse-import-entries.test.ts`) plutôt que deux quasi-identiques ; ajouter une 3ᵉ entité important
via le même flux (ex : inventaire partagé, plus tard) ne demanderait qu'une configuration, pas une
nouvelle implémentation. En contrepartie, le backup reste un chemin de validation distinct et plus
strict — voulu, mais à garder en tête si son usage évolue vers l'acceptation de fichiers partiels
ou externes.
