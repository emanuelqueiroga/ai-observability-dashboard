# AI Observability Dashboard MVP

## Ask

Criar uma aplicação web/dashboard para monitorar trabalhos com agentes e modelos de IA, começando pelo cadastro de projetos via interface web e via API para que cada projeto conectado possa se registrar programaticamente.

## Design decisions

- Raiz do projeto: `/Users/emanuelqueiroga/ai-observability-dashboard`.
- Stack inicial: Next.js App Router com TypeScript e Tailwind CSS.
- O MVP começa com uma arquitetura local-first e API-first.
- Projetos são a entidade raiz de observabilidade: sessões, agentes, eventos, custos e alertas serão associados a um projeto.
- O cadastro precisa funcionar por dois caminhos equivalentes:
  - Web UI: formulário no dashboard.
  - API: `POST /api/projects`, para integrações externas.
- A listagem precisa estar disponível em:
  - Web UI: painel de projetos cadastrados.
  - API: `GET /api/projects`.
- Persistência inicial em memória para validar o fluxo e manter o MVP pequeno; deve ser substituída por banco no próximo passo.

## Planned files changed

- `app/page.tsx`: dashboard inicial com cadastro e listagem de projetos.
- `app/api/projects/route.ts`: endpoint de cadastro/listagem.
- `components/project-registration-form.tsx`: formulário client-side.
- `lib/projects.ts`: regras de domínio e repositório inicial de projetos.
- `__tests__/projects.test.ts`: testes de domínio e API.
- `__tests__/dashboard.test.tsx`: teste de renderização do dashboard/formulário.

## Edge cases

- Nome do projeto vazio deve ser rejeitado.
- Slug vazio ou inválido deve ser rejeitado.
- Slug duplicado deve ser rejeitado.
- URL do repositório é opcional, mas, quando fornecida, deve ser válida.
- `POST /api/projects` deve retornar `201` ao criar e `400` para payload inválido.
- `GET /api/projects` deve retornar uma lista estável.

## Trade-offs

- Persistência em memória simplifica o MVP, mas não sobrevive a restart do servidor.
- Autenticação/API keys ficam fora do primeiro corte, mas a modelagem já deixa espaço para adicionar `project.apiKey` ou `ingestToken`.
- Métricas de tokens, latência e custos ficam para a fase seguinte, após a raiz `Project` estar pronta.
