# 0051 — Changer de race sans changer les scores réels

**Statut** : Acceptée

## Contexte

Une race hors registre se saisit en texte libre avec sa vitesse, et les scores saisis incluent
déjà les bonus raciaux, puisque l'app ne les calcule pas. Quand une race rejoint le registre
(Tieffelin, Nain des collines…), les personnages existants restent en texte libre. En testant
Mordaï, l'utilisateur a relevé deux problèmes :

- la liste affichait « Autre » alors que « Tieffelin » y figurait, et choisir la race dans la
  liste ajoutait ses bonus à des scores qui les contenaient déjà ; la vitesse saisie (12 m, dont 3 m
  de Déplacement sans armure) était remplacée par celle de la race (9 m) ;
- le champ de vitesse (« 12 ») n'avait pas de libellé visible.

## Décision

- **Reconnaissance** : quand la race en texte libre correspond au nom d'une race connue (casse et
  accents ignorés), un encart l'indique, résume ses règles (bonus, vitesse) et propose « Appliquer
  les règles de la race ».
- **Passage sans surprise** (`changeRace`) : passer d'une race en texte libre à une race connue
  conserve les scores effectifs. Les bonus fixes sont retirés des scores de base, et une vitesse
  saisie plus rapide que celle de la race devient un bonus de vitesse
  ([0050](0050-speed-extra-bonus.md)). L'inverse, d'une race connue vers le texte libre, reporte les
  bonus (y compris ceux au choix) dans les scores de base et la vitesse de la race dans la vitesse
  saisie. Entre deux races connues, seuls la race et ses choix changent : c'est le cas de la
  création de personnage, où les scores de base sont ceux de l'achat de points.
- Les bonus au choix (ex : Demi-elfe) ne peuvent pas être retirés automatiquement : l'app ne sait
  pas où ils avaient été placés. Le joueur les choisit ensuite dans l'encadré de la race.
- Les champs du texte libre ont des libellés visibles (« Nom de la race », « Vitesse (m) »), et
  l'encadré d'une race connue affiche ses bonus et sa vitesse.

## Conséquences

Un personnage importé ou créé avant l'ajout de sa race au registre passe aux règles en un clic,
sans double comptage. La même approche pourra servir aux classes (ex : un « Moine » saisi en texte
libre le jour où le Moine entre dans le registre).
