<!-- Géré par claude-kit (module dependabot) : ne pas éditer, voir /claude-kit:sync. -->

## Dependabot

Les PR Dependabot ne reçoivent ni issue ni entrée sur le board : ce n'est pas du travail planifié.
Merge direct (merge commit, pas squash) une fois la CI verte pour un bump minor/patch ou une GitHub
Action officielle. Un bump **majeur** d'une dépendance applicative mérite une lecture du changelog
avant merge, et un ADR s'il change une convention.

Les bumps majeurs de `@types/node` sont ignorés (`dependabot.yml`) : la majeure suit celle de Node,
et change avec elle.
