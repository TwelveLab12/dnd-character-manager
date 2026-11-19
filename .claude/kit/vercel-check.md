<!-- Géré par claude-kit (module vercel-check) : ne pas éditer, voir /claude-kit:sync. -->

## Vercel

La CI rapporte l'état du job `build` à Vercel comme Deployment Check nommé `Vercel - dnd-character-manager: ci`, qui
bloque la promotion en production : statut de commit `pending` à la première étape, puis `success`
seulement si le job a réussi (dernière étape, `if: always()`). Les autres jobs du workflow n'ont
pas d'effet sur ce statut. Le nom (`VERCEL_CHECK` dans `ci.yml`) doit rester identique à celui
sélectionné dans Vercel (Settings › Deployment Checks), qui vit hors du repo : ne pas le changer
sans mettre Vercel à jour.
