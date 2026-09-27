# 0064 — Invitation à installer l'application

**Statut** : Acceptée

## Contexte

L'application est installable (manifest et service worker, [0045](0045-offline-service-worker.md)).
Installée, elle s'ouvre depuis l'écran d'accueil, en plein écran et sans connexion. Mais rien ne le
disait aux joueurs, et les navigateurs le signalent peu ou pas du tout.

## Décision

- Un composant `InstallPrompt` monté une fois dans le layout racine affiche un **toast** qui reste
  à l'écran jusqu'à un choix, 3 s après l'ouverture de la page, **seulement si l'application n'est
  pas installée** (`display-mode: standalone`, ou `navigator.standalone` sur iOS).
- Selon le navigateur :
  - **Chrome, Edge, Android** : l'événement `beforeinstallprompt` est intercepté, ce qui masque la
    mini-barre du navigateur, et le bouton « Installer » ouvre l'invite native ;
  - **iPhone, iPad** : aucune invite programmable, le toast explique « Partager » puis « Sur
    l'écran d'accueil » ;
  - **navigateurs sans installation** (Firefox sur ordinateur…) : rien n'est affiché.
- Case **« Ne plus me demander »**, mémorisée sur l'appareil (localStorage). « Plus tard » sans la
  case ne vaut que pour la session (sessionStorage), pour ne pas relancer à chaque page. Une
  installation acceptée ou l'événement `appinstalled` rendent le choix définitif.
- Ces préférences propres à l'appareil sont hors repositories et hors sauvegarde, comme la
  dernière nouveauté vue ([0058](0058-changelog-page.md)).

## Conséquences

Chrome ne déclenche `beforeinstallprompt` que si l'application remplit ses critères
d'installabilité. Une régression du manifest ou du service worker ferait donc disparaître
l'invitation sans erreur visible.
