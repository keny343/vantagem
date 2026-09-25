# E2E (Playwright)

Cobre o fluxo crítico da loja sem dependências externas (Supabase opcional — em `NODE_ENV=development` os uploads vão para disco).

## O que testa

1. Catálogo mostra o artigo `e2e-cabo-usb`
2. Registo → carrinho → checkout com comprovativo JPEG → página do pedido
3. Admin confirma pagamento → cliente vê «Pagamento confirmado»

## Local

Precisas de Postgres via Docker Compose (porta **5434**) e:

```bash
# Postgres
docker compose up postgres -d

# Seed E2E (limpa pedidos de teste e garante o artigo Cabo USB-C E2E)
cd backend
cp .env.example .env   # DATABASE_URL=...@localhost:5434/vantagem
export DATABASE_URL=postgresql://vantagem:vantagem_dev@127.0.0.1:5434/vantagem
export ADMIN_EMAIL=admin@e2e.vantagem.test
export ADMIN_PASSWORD=E2eAdminPass99
export CSRF_SECRET=e2e-csrf-secret-hardening
npm ci && npm run build
node dist/db/prestart.js
npm run seed:e2e

# Playwright arranca API + Vite sozinho
cd ../e2e
npm install
npx playwright install chromium
npm test
```

O `playwright.config.ts` força `CORS_ORIGINS` com `127.0.0.1` e `localhost`, e `reuseExistingServer: false` para não reutilizar um backend antigo.

## CI

O job `e2e` em `.github/workflows/ci.yml` sobe Postgres, migra, faz seed, instala Chromium e corre os specs.
