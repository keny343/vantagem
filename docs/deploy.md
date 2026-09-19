# Deploy

## Checklist (ordem)

1. **GitHub** — publicar este repo na branch `main`
2. **Render** — Blueprint `render.yaml` (API Docker + Postgres gerido)
3. **Supabase** — bucket público `artigos` para fotografias e comprovativos
4. **Vercel** — importar repo, root `frontend/`
5. Ligar URLs cruzadas (`CORS_ORIGINS` ↔ `VITE_API_BASE`) e redeploy

## Frontend → Vercel

1. Root directory: `frontend`
2. Build: `npm run build` · Output: `dist`
3. Env:
   - `VITE_API_BASE=https://<api>.onrender.com` (sem barra final)
4. Redeploy depois de definir a URL da API (a variável entra no bundle no build).

## Backend → Render

1. Blueprint `render.yaml` ou Web Service Docker com root `backend`
2. Dockerfile incluído; health check: `/health`
3. Env:
   - `DATABASE_URL` — vem do Postgres Render (`fromDatabase`)
   - `DATABASE_SSL=true`
   - `CORS_ORIGINS=https://<frontend>.vercel.app`
   - `FRONTEND_URL=https://<frontend>.vercel.app`
   - `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_STORAGE_BUCKET=artigos`
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` — cria o primeiro administrador no arranque
   - `NODE_ENV=production`
4. Bind: `0.0.0.0:$PORT` (já no código)
5. Não corras `npm run seed` em produção. O catálogo começa vazio.

## Base de dados → Render Postgres

1. Instância `vantagem-db` (mesmo região da API: Frankfurt)
2. A API usa a connection string interna
3. Migrações correm no arranque do contentor (`prestart:migrate`)

## Uploads → Supabase Storage

1. Project Settings → API: `SUPABASE_URL` e service role key
2. Storage: criar bucket público `artigos`
3. Pastas usadas pela API: `produtos/` e `comprovativos/`

## Fluxo

```
Browser (Vercel) --HTTPS--> API (Render) --TLS interno--> Postgres (Render)
API --HTTPS--> Supabase Storage (fotografias)
```

Cookies de sessão e CSRF usam `SameSite=None; Secure` em produção.
