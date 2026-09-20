# E2E (Playwright)

Cobre o fluxo crítico da loja sem dependências externas (Supabase opcional — em `NODE_ENV=development` os uploads vão para disco).

## O que testa

1. Catálogo mostra o artigo `e2e-cabo-usb`
2. Registo → carrinho → checkout com comprovativo JPEG → página do pedido
3. Admin confirma pagamento → cliente vê «Pagamento confirmado»

## Local

Precisas de Postgres (ex. na porta 5432) e:

```bash
# terminal 1 — API
cd backend
export DATABASE_URL=postgres://vantagem:vantagem@127.0.0.1:5432/vantagem_e2e
export ADMIN_EMAIL=admin@e2e.vantagem.test
export ADMIN_PASSWORD=E2eAdminPass99
export CSRF_SECRET=e2e-csrf
export NODE_ENV=development
npm ci && npm run build
node dist/db/prestart.js
npm run seed:e2e
npm run start:e2e

# terminal 2 — loja (proxy /api → API)
cd frontend
VANTAGEM_API_TARGET=http://127.0.0.1:4200 npm run dev -- --host 127.0.0.1 --port 5174

# terminal 3 — testes
cd e2e
npm install
npx playwright install chromium
npm test
```

O `playwright.config.ts` também pode arrancar API + Vite sozinho se a BD já estiver migrada/seedada e `start:e2e` estiver buildado.

## CI

O job `e2e` em `.github/workflows/ci.yml` sobe Postgres, migra, faz seed, instala Chromium e corre os specs.
