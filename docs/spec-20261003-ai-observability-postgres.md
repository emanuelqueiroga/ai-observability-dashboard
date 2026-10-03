# Spec — Observability System with Postgres Docker

## Ask

Transformar o MVP local-first em um sistema menor, porém completo, com:

- Postgres rodando em Docker;
- dashboard geral para todos os projetos;
- página própria por projeto;
- alertas no dashboard geral e no projeto individual;
- ingestão de eventos/métricas por projeto;
- base pronta para monitorar agentes, modelos, tokens, custo e latência.

## Design decisions

- Banco: Postgres em Docker via `compose.yaml`.
- Driver inicial: `pg`.
- Migração explícita via script SQL `scripts/migrate.mjs`.
- A API continua com autenticação simples por cookie.
- Dados de projeto passam a ser lidos/escritos no Postgres; o arquivo JSON fica apenas como migração one-shot inicial.
- Eventos e alertas ficam no mesmo banco para manter o sistema coeso no MVP.
- Dashboard geral agrega todos os projetos e alertas ativos.
- Página de projeto detalha eventos, alertas e métricas daquele projeto.

## Planned files changed

- `compose.yaml`: service Postgres 16.
- `.env.local`: `DATABASE_URL`.
- `lib/db.ts`: pool Postgres reutilizável.
- `lib/projects.ts`: reposítorio Postgres de projetos.
- `lib/events.ts`: criação/listagem de eventos.
- `lib/alerts.ts`: geração/listagem de alertas.
- `app/page.tsx`: dashboard geral.
- `app/projects/[slug]/page.tsx`: página do projeto.
- `app/api/projects/route.ts`: passa a usar Postgres.
- `app/api/projects/[slug]/events/route.ts`: ingest/listagem de eventos.
- `app/api/alerts/route.ts`: alertas gerais e por projeto.

## Edge cases

- Banco indisponível deve falhar claramente como `503`/`erro`.
- Slug de projeto inexistente deve retornar `404`.
- Evento sem `projectId`/`slug` válido deve retornar `400`.
- Alertas devem aparecer tanto globalmente quanto no projeto.
- Eventos de alto consumo de tokens devem gerar alerta de contexto.
- Erros de integração devem gerar alerta.
- Métricas básicas devem ser exibidas sem exigir dados reais ainda.

## Trade-offs

- Implementação com SQL direto no MVP para evitar introduzir ORM grande agora.
- Migração inicial via script, sem Prisma/Drizzle para manter simplicidade.
- Docker é dependência explícita para rodar o banco local.
