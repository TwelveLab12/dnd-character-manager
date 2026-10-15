<!-- Géré par claude-kit (module docs-adr) : ne pas éditer, voir /claude-kit:sync. -->

## Documentation des décisions

- `docs/adr/NNNN-*.md` : une décision d'architecture = un fichier, format Statut / Contexte /
  Décision / Conséquences, numéroté séquentiellement. **Jamais édité rétroactivement** : une décision
  reconsidérée donne lieu à un nouvel ADR qui référence l'ancien. Lire les ADR avant un changement
  structurel ou d'outillage qui pourrait en contredire un.
- `docs/dependencies.md` : ce que fait chaque librairie du `package.json` et pourquoi elle est là. À
  consulter avant d'ajouter ou d'évaluer une dépendance, et à mettre à jour dans la même PR que
  l'ajout.
- Tenir ces deux sources à jour de façon proactive, en commit dédié dans la branche déjà ouverte
  plutôt que dans une PR séparée.
