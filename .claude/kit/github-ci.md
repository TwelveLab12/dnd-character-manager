<!-- Géré par claude-kit (module github-ci) : ne pas éditer, voir /claude-kit:sync. -->

## CI

`.github/workflows/ci.yml` (géré par claude-kit, régénéré par `/claude-kit:sync`) lance sur chaque
push/PR vers `main` : typecheck → format:check → lint:ci → test → build. Chaque job a un délai maximum (`timeout-minutes`). Une PR ne se
merge pas tant que la CI est rouge. La version de Node est la même qu'en local : `.nvmrc`.
