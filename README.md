# Vantagem

Plataforma **full stack de e-commerce** para venda e gestão de electrónica em Angola (DTC — loja única, não marketplace multi-vendedor).

Loja pública + área de cliente + painel administrativo. Pagamento por **transferência bancária** com upload de comprovativo PDF e confirmação humana pelo admin.

**Demo:** [https://vantagem-one.vercel.app](https://vantagem-one.vercel.app)

## Problema

Compradores em Angola precisam de comprar electrónica online com preços em Kwanzas, stock real, factura e um fluxo de pagamento confiável (transferência + verificação). A loja precisa de um painel para catálogo, stock, comprovativos e suporte.

## Funcionalidades

### Cliente

- Registo, login, logout, recuperação de palavra-passe
- Catálogo, filtros, produto com variantes e stock
- Carrinho e checkout (preços/descontos/envio calculados no servidor)
- Pedidos, comprovativo PDF, estados da encomenda
- Conta: perfil, endereços, favoritos, cupões, devoluções, tickets, FAQ

### Administrador

- Dashboard e gestão de produtos/categorias/stock
- Fila de comprovativos e confirmação de pagamento
- Transições de estado controladas (máquina de estados)
- Utilizadores, cupões, tickets de suporte

### Pedidos e stock

- Estados: `pendente` → `pago` → `em_preparacao` → `enviado` → `entregue` (ou `cancelado`)
- Stock **só é debitado** quando o admin confirma o pagamento (`FOR UPDATE` + update condicional)
- Cancelamento após pagamento repõe stock (exceto após saída/entrega, conforme regras)
- Idempotência no checkout (`idempotencyKey`)
- Histórico em `historico_estado_pedido`

### Segurança

- Sessões com cookie httpOnly; CSRF (HMAC / double-submit)
- RBAC `cliente` | `admin` no backend
- Proteção IDOR em pedidos, endereços, favoritos, tickets, etc.
- Rate limit (login, checkout, upload, cupão, API global)
- Uploads com magic bytes; comprovativos só PDF
- Zod em inputs; preços nunca confiados do frontend
- Helmet, CORS por origem, logs sem secrets, `/health` e `/ready`

## Arquitectura

```
Browser (React/Vite)  →  API Express (Render)  →  PostgreSQL
                              ↓
                       Supabase Storage (fotos / comprovativos)
```

Frontend: Vercel · Backend: Render · Base de dados: Postgres gerido (Render)

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, React Router 7 |
| Backend | Node.js ≥20, Express 5, TypeScript, Zod, pg |
| Dados | PostgreSQL 16, migrations SQL |
| Auth | bcryptjs, sessões em BD |
| Uploads | Multer + Supabase S3 API |
| Testes | Vitest, Supertest, Playwright (E2E) |
| CI | GitHub Actions |

## Arranque local

```bash
# Terminal 1 — Postgres
docker compose up postgres -d

# Terminal 2 — API
cd backend
cp .env.example .env
npm install
npm run migrate
npm run seed
npm run dev

# Terminal 3 — Loja
cd frontend
cp .env.example .env   # VITE_API_BASE vazio = proxy Vite
npm install
npm run dev
```

- Loja: http://localhost:5174  
- API: http://localhost:4200  
- Conta: `/registo`. Em produção o primeiro admin nasce de `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

Variáveis: ver `backend/.env.example` e `frontend/.env.example` (nunca commits de `.env`).

## Testes

```bash
cd backend && npm run typecheck && npm test && npm run build
cd frontend && npm run typecheck && npm run build
cd e2e && npm test   # requer API + DB (ver docs/e2e.md)
```

CI (`.github/workflows/ci.yml`): typecheck + testes + build backend/frontend + Playwright.

Testes de concorrência de stock correm quando há Postgres (`DATABASE_URL`); em CI com service Postgres são obrigatórios.

## Deploy

1. **Postgres + API** — blueprint `render.yaml` (`vantagem-api`, `vantagem-db`)
2. **Frontend** — projecto Vercel `vantagem` → domínio `vantagem-one.vercel.app`
3. Env críticos: `DATABASE_URL`, `CORS_ORIGINS`, `FRONTEND_URL`, `SESSION`/`CSRF`, Supabase, `ADMIN_*`, `LOJA_IBAN`, `PAGAMENTO_MODO=producao`  
   Pagamento actual: **só transferência** + PDF do comprovativo + confirmação no admin (sem API do banco / referência Multibanco).

Detalhes: `docs/deploy.md`, `DEPLOY_STEPS.md`, `HARDENING.md`.

## Documentação

| Doc | Conteúdo |
|-----|----------|
| `PRODUCT.md` | Produto e posicionamento |
| `DESIGN.md` | Identidade visual |
| `docs/api.md` | API |
| `docs/database.md` | Esquema |
| `docs/security.md` | Segurança |
| `docs/e2e.md` | E2E |
| `HARDENING.md` | Medidas v1–v3 |

## Nota de nomenclatura

Isto é **e-commerce de loja única**, não marketplace multi-vendedor (sem vendedores independentes, comissões ou payouts).
