# Vantagem · Marketplace de electrónica

Loja + painel administrativo. Frontend React (Vercel), API Node/Express (Render), PostgreSQL (Aiven).

A base visual veio do Lovable (`gleam-gear-market`); esta fase liga dados reais, autenticação e checkout seguros.

## Arranque local

```bash
# Terminal 1 — Postgres (Docker Desktop a correr)
docker compose up postgres -d

# Terminal 2 — API
cd backend
cp .env.example .env   # ajusta DATABASE_URL se necessário
npm install
npm run migrate
npm run seed
npm run dev

# Terminal 3 — Loja
cd frontend
npm install
npm run dev
```

- Loja: http://localhost:5174  
- API: http://localhost:4200  
- Contas de demo (após seed): ver `docs/database.md`

Se o Docker Desktop estiver offline, podes apontar `DATABASE_URL` para um Postgres local já existente (o role precisa de poder criar tabelas).


## Etapas

1. **Dados** — esquema PostgreSQL, seed, API de catálogo, páginas sem mocks  
2. **Autenticação** — bcrypt, sessões com expiração, rate limit no login  
3. **Checkout** — pedido + stock em transacção  
4. **Segurança** — validação, CSRF, rotas admin  
5. **Deploy** — Vercel + Render + Aiven  

## Estrutura

```
backend/     API Express + pg
frontend/    React + Vite (paleta Lovable)
docs/        esquema, API, segurança, deploy
```
