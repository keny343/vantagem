# Deploy

## Frontend → Vercel
1. Importar o repositório; root directory `frontend`.
2. Build: `npm run build` · Output: `dist`.
3. Env: `VITE_API_BASE=https://<api>.onrender.com` (sem barra final).
4. Redeploy após definir a URL da API.

## Backend → Render
1. Blueprint `render.yaml` ou Web Service com root `backend`.
2. Build: `npm ci && npm run build` · Start: `npm run migrate && npm start`.
3. Env obrigatórias:
   - `DATABASE_URL` (Aiven connection string)
   - `DATABASE_SSL=true`
   - `CORS_ORIGINS=https://<frontend>.vercel.app`
   - `NODE_ENV=production`
4. Health check: `/health`. Bind: `0.0.0.0:$PORT`.

## Base de dados → Aiven
1. Criar serviço PostgreSQL.
2. Copiar URI SSL para `DATABASE_URL`.
3. Correr `npm run migrate && npm run seed` uma vez (o start do Render já corre migrate).

## Fluxo de dados
Browser (Vercel) → API (Render) → Postgres (Aiven)
