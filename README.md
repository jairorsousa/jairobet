# JairoBet

Controle financeiro pessoal — contas bancárias, corretoras/carteiras de cripto e casas de apostas.

## Setup local

```bash
pnpm install
cp .env.example .env.local
# Preencha com credenciais do Supabase ou use valores do `supabase start`

pnpm db:start          # Supabase local (Docker)
pnpm db:reset          # Aplica migrations
pnpm dev               # http://localhost:3000
```

## Scripts

| Comando | Descrição |
|---------|-----------|
| `pnpm dev` | Servidor de desenvolvimento |
| `pnpm build` | Build de produção |
| `pnpm typecheck` | Verificação TypeScript |
| `pnpm lint` | ESLint |
| `pnpm db:start` | Supabase local |
| `pnpm db:push` | Push migrations para remoto |

## Documentação

- `PRD-jairobet.md` — requisitos do produto
- `arquitetura.md` — decisões técnicas
- `plano-desenvolvimento.md` — roadmap de sprints
- `DESIGN_SYSTEM.md` — tokens e componentes visuais