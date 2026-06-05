# Deploy no Render (passo a passo)

## Ordem correta

O build **não precisa** de banco. O banco é necessário só quando o app **inicia**.

### 1. Criar o PostgreSQL

1. Render Dashboard → **New +** → **PostgreSQL**
2. Nome: `unicartola-db` (ou qualquer)
3. Crie e espere ficar **Available**

### 2. Criar o Web Service

1. **New +** → **Web Service**
2. Conecte o repo `Ricardo071106/UniCartola`
3. Configuração:

| Campo | Valor |
|-------|--------|
| **Build Command** | `chmod +x scripts/render-build.sh && ./scripts/render-build.sh` |
| **Start Command** | `npm run start:prod` |
| **Node** | `NODE_VERSION=20` |

### 3. Variáveis de ambiente

No Web Service → **Environment**:

1. **Add from database** → selecione o Postgres → isso cria `DATABASE_URL` automaticamente  
   - Use **Internal Database URL**, não External (External pode usar IPv6 e falhar com `ENETUNREACH`)
2. Se o Postgres e o Web Service estão no **mesmo** Render, a Internal URL é a correta
2. Adicione manualmente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `CRON_SECRET` (opcional)

**Sem `DATABASE_URL` o deploy de build antigo falhava** porque rodava migrate no build. Agora migrate roda só no **start** (`start:prod`).

### 4. Primeiro deploy (seed sem Shell)

No plano free o Shell pode não estar disponível. Use variável temporária:

| Variável | Valor |
|----------|--------|
| `RUN_DB_SEED` | `1` |

Isso roda `npm run db:seed` uma vez no start. Depois que o app subir, **apague** `RUN_DB_SEED` e redeploy.

Se tiver Shell: `npm run db:seed` manualmente.

### 5. Blueprint (opcional)

Você pode usar o arquivo `render.yaml` na raiz com **New +** → **Blueprint** para criar banco + app juntos.

## Comandos — resumo

```text
Build:  npm install && npm run build -w web
Start:  npm run start:prod    # migrate + next start
Seed:   npm run db:seed       # só uma vez, no Shell
```

## Erro comum

| Erro | Causa | Solução |
|------|--------|---------|
| Build failed no `db:migrate` | Migrate no build sem `DATABASE_URL` | Use o Build Command acima (sem migrate) |
| Build para em "Creating an optimized production build" | `NODE_ENV=production` no install pula Tailwind/TS (devDeps) | Build: `chmod +x scripts/render-build.sh && ./scripts/render-build.sh` |
| `ENETUNREACH` ao iniciar (`db:migrate`) | `DATABASE_URL` External ou Supabase direto (IPv6) | **Apague** `DATABASE_URL` manual → **Add from database** (Internal). Não use URL copiada de fora do Render. |
| App sobe mas páginas vazias | Seed não rodou | `npm run db:seed` no Shell |
| Login não funciona | Falta Supabase | Preencha as duas vars `NEXT_PUBLIC_SUPABASE_*` |
