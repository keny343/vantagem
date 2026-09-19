# Vantagem Deploy — Ordem de Passos

## 1️⃣ Render: Criar serviço API
**Link:** https://dashboard.render.com/blueprint/new?repo=https://github.com/keny343/vantagem

1. **Blueprint Name:** vantagem
2. **Branch:** main
3. Clica **Apply**
4. ⚠️ **Não funciona ainda** — falta DATABASE_URL

---

## 2️⃣ Aiven: Criar PostgreSQL
**Link:** https://console.aiven.io

1. **Create service**
2. **PostgreSQL** → Free plan → **Frankfurt**
3. Aguarda até ficar **Running**
4. **Overview** → **Connection information**
5. **Copia o Service URI** (postgres://...)

---

## 3️⃣ Render: Configurar DATABASE_URL
**Link:** https://dashboard.render.com (serviço vantagem-api)

1. **Environment** tab
2. **Edit** `DATABASE_URL` → cola o URI do Aiven
3. **Edit** `CORS_ORIGINS` → `https://vantagem-one.vercel.app`
4. **Save Changes** (Render redeploy automático)
5. Aguarda até **Live** (~3-5 min)
6. **Copia a URL** do serviço (ex: https://vantagem-api-xyz.onrender.com)

---

## 4️⃣ Vercel: Configurar VITE_API_BASE
**Link:** https://vercel.com/keny343s-projects/vantagem/settings/environment-variables

1. **Add New** → **Environment Variable**
2. **Name:** `VITE_API_BASE`
3. **Value:** `https://vantagem-api-xyz.onrender.com` (URL do Render)
4. **Environments:** Production ✓
5. **Save**
6. **Deployments** → última deploy → **⋯** → **Redeploy**

---

## ✅ Verificação final
- Frontend: https://vantagem-one.vercel.app
- API: https://vantagem-api-xyz.onrender.com/health
- Testa login + catálogo na loja

**Contas demo:**
- Admin: `admin@vantagem.pt` / `AdminDemo!2026`
- Cliente: `cliente@vantagem.pt` / `ClienteDemo!2026`
