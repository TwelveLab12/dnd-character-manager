# 0006 — Déploiement Vercel sur un sous-domaine du domaine existant

**Statut** : Acceptée

## Contexte

Le domaine `brunoschvartz.dev` est déjà détenu (Cloudflare DNS) et sert le portfolio
(`BrunoSchvartzDev`) sur Vercel, apex canonique (voir l'ADR équivalente dans ce dépôt-là). On veut
héberger ce projet sans acheter de nouveau domaine, avec une URL propre et stable.

## Décision

Nouveau projet Vercel (plan Hobby, gratuit), branché sur le repo `dnd-character-manager`,
indépendant du projet portfolio. Sous-domaine `dnd.brunoschvartz.dev` : enregistrement CNAME côté
Cloudflare (DNS only, proxy désactivé, même pattern que l'apex) pointant vers Vercel, domaine ajouté
dans les settings du projet Vercel qui gère lui-même le certificat SSL. L'URL `*.vercel.app` fournie
automatiquement par Vercel reste disponible sans configuration DNS supplémentaire (preview/fallback).

## Conséquences

Aucun coût de domaine additionnel, déploiement indépendant du portfolio (un incident sur l'un
n'affecte pas l'autre), déploiements de preview automatiques par PR grâce à l'intégration GitHub de
Vercel.
