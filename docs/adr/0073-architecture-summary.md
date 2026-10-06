# 0073 — Synthèse d'architecture et index des ADR par thème

**Statut** : Acceptée

## Contexte

Le dossier `docs/adr/` compte plus de 70 décisions. Beaucoup sont des évolutions fonctionnelles
(une classe, un panneau, une palette) plus que des choix d'architecture. Pour savoir quelles règles
s'appliquent aujourd'hui, il faut tout relire. C'est coûteux pour une personne qui découvre le
projet, et pour un agent qui doit respecter ces règles sans en lire 70.

Les ADR s'accumulent surtout les uns à côté des autres. Quelques-uns en reconsidèrent un autre en
partie (0015 pour 0013, 0031 pour 0021). L'[ADR 0001](0001-record-architecture-decisions.md)
interdit de les retoucher : une décision reconsidérée donne un nouvel ADR. Marquer l'ancien
« Remplacée par », comme le font MADR ou Nygard, reviendrait à le modifier.

## Décision

- **`docs/architecture.md`**, écrit à la main, est la vue à jour des ADR :
  - une vingtaine de règles actives, en une ou deux phrases, chacune avec ses ADR sources ;
  - un tableau des reconsidérations : ce qui n'est plus vrai, et ce qui l'est encore ;
  - un index de tous les ADR, rangés par thème.
- **Un test** (`src/docs/architecture-doc.test.ts`) échoue si un ADR n'est pas dans l'index, s'il y
  figure deux fois, ou si un lien du document pointe vers un fichier absent. Un nouvel ADR se range
  donc dans la même PR que lui.
- **Aucun ADR existant n'est modifié.** Le statut reste « Acceptée » pour tous. Une décision qui en
  reconsidère une autre le dit dans son propre texte, et une ligne s'ajoute au tableau des
  reconsidérations.
- Le `CLAUDE.md` renvoie vers cette synthèse, pour qu'un agent lise les règles avant les ADR.

Écartés :

- **Statuts « Remplacée par » ou métadonnée « Thème » dans chaque ADR.** Cela demande de modifier
  les 71 fichiers, contre la règle de l'ADR 0001.
- **Un index généré** (`adr-tools`, `log4brains`). Un index automatique liste les ADR, mais ne dit
  pas lesquels comptent ni ce qui a changé. Ce tri demande un jugement, et un outil de plus à
  maintenir n'y change rien.

## Conséquences

- Chaque nouvel ADR coûte une ligne d'index et, s'il pose une règle ou en reconsidère une, une
  ligne dans les règles ou le tableau. Le test force l'index. Les règles, elles, ne sont pas
  vérifiées par le code : leur relecture fait partie de la revue d'un ADR.
- Une règle qui devient fausse doit être corrigée ici dans la même PR que l'ADR qui la change.
  Sinon la synthèse induit en erreur, ce qui est pire que de ne pas en avoir.
- Une règle importante pourrait un jour devenir un test ou une règle de lint, qui la ferait
  respecter sans relecture.
