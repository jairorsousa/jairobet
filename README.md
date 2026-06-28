# JairoBet

Controle financeiro pessoal — contas bancárias, corretoras/carteiras de cripto e casas de apostas.

## Setup local (5 passos)

1. **Clonar e instalar**
   ```bash
   pnpm install
   cp .env.example .env.local
   ```

2. **Subir Supabase local** (Docker)
   ```bash
   pnpm db:start
   ```

3. **Aplicar migrations** (e seed opcional)
   ```bash
   pnpm db:reset
   ```

4. **Configurar `.env.local`** com URL e anon key do `supabase start` (ou projeto remoto)

5. **Rodar o app**
   ```bash
   pnpm dev
   ```
   Acesse http://localhost:3000, crie o usuário operador em `/login` e cadastre titulares/contas.

> O `supabase/seed.sql` cria titulares e contas demo quando já existe um usuário em `auth.users`. Após o primeiro cadastro, rode `pnpm db:reset` novamente para popular.

## Scripts

| Comando | Descrição |
|---------|-----------|
| `pnpm dev` | Servidor de desenvolvimento |
| `pnpm build` | Build de produção |
| `pnpm start` | Servidor de produção local |
| `pnpm test` | Testes unitários (Vitest) |
| `pnpm typecheck` | Verificação TypeScript |
| `pnpm lint` | ESLint |
| `pnpm db:start` | Supabase local |
| `pnpm db:reset` | Reset DB + migrations + seed |
| `pnpm db:push` | Push migrations para remoto |

## Exportação CSV

| Endpoint | Descrição |
|----------|-----------|
| `GET /api/export/movements?from=&to=&type=&holder=&account=` | Movimentações filtradas |
| `GET /api/export/result?from=&to=&scope=conta\|betting\|titular\|resumo` | Relatórios de resultado |

Arquivos em UTF-8 com BOM e separador `;` (compatível com Excel pt-BR). Botões na UI em `/movimentacoes` e `/relatorios`.

## Deploy em produção

### Supabase

1. Criar projeto em [supabase.com](https://supabase.com)
2. Aplicar migrations: `pnpm db:push` (com CLI linkado ao projeto)
3. Criar usuário operador em **Authentication → Users**
4. Verificar RLS: executar `scripts/verify-rls.sql` no SQL Editor

### Vercel

1. Importar repositório na [Vercel](https://vercel.com)
2. Variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy — rotas protegidas por middleware (login obrigatório)
4. **Nunca** expor `SUPABASE_SERVICE_ROLE_KEY` como variável `NEXT_PUBLIC_`

### Checklist go-live

- [ ] Migrations aplicadas em produção
- [ ] RLS habilitado em todas as tabelas (`scripts/verify-rls.sql`)
- [ ] Login testado em produção
- [ ] Dashboard conferido com dados reais ou demo
- [ ] Export CSV abre corretamente no Excel/Sheets

## Documentação

- `PRD-jairobet.md` — requisitos do produto
- `arquitetura.md` — decisões técnicas
- `plano-desenvolvimento.md` — roadmap de sprints
- `DESIGN_SYSTEM.md` — tokens e componentes visuais