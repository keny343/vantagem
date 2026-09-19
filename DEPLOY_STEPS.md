# Vantagem Deploy — Ordem de Passos

## 1️⃣ Render: API + Postgres
**Link:** https://dashboard.render.com/blueprint/new?repo=https://github.com/keny343/vantagem

1. **Blueprint Name:** vantagem
2. **Branch:** main
3. Clica **Apply** — cria `vantagem-api` e `vantagem-db` (Frankfurt)
4. Environment do serviço API:
   - `CORS_ORIGINS` e `FRONTEND_URL` → URL da Vercel
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET=artigos`
   - `ADMIN_EMAIL` e `ADMIN_PASSWORD` (primeiro administrador)
5. Aguarda até **Live** e copia a URL (`https://vantagem-api-….onrender.com`)

## 2️⃣ Supabase: bucket de uploads

1. Storage → New bucket → `artigos` → **Public**
2. Project Settings → API → copiar URL e **service_role** para o Render

## 3️⃣ Vercel: frontend
**Link:** https://vercel.com/new

1. Importar `keny343/vantagem`
2. Root Directory: `frontend`
3. Env: `VITE_API_BASE=https://vantagem-api-….onrender.com` (sem barra final)
4. Deploy

## ✅ Verificação

- Frontend: URL da Vercel
- API: `https://vantagem-api-….onrender.com/health`
- Entrar com o email/palavra-passe definidos em `ADMIN_*` (não há contas demo no site)
