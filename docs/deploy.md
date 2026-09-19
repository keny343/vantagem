# Deploy

## Checklist (ordem)

1. **Aiven** — criar Postgres, copiar URI SSL → `DATABASE_URL`
2. **GitHub** — publicar este repo (precisa de token com scope `repo`)
3. **Render** — Web Service Docker (`backend/`), blueprint `render.yaml`
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
3. Env obrigatórias:
   - `DATABASE_URL` — URI Aiven (com `?sslmode=require` se necessário)
   - `DATABASE_SSL=true`
   - `CORS_ORIGINS=https://<frontend>.vercel.app`
   - `NODE_ENV=production`
   - `SESSION_COOKIE_NAME=vantagem_session`
4. Bind: `0.0.0.0:$PORT` (já no código)
5. Após o primeiro deploy: `npm run seed` uma vez (shell Render ou local com a URI de produção) para catálogo + contas demo

## Base de dados → Aiven

1. Serviço PostgreSQL
2. Copiar connection string para `DATABASE_URL`
3. Migrações correm no arranque do contentor (`prestart:migrate`)

## Fluxo

```
Browser (Vercel) --HTTPS--> API (Render) --TLS--> Postgres (Aiven)
```

Cookies de sessão e CSRF usam `SameSite=None; Secure` em produção.
