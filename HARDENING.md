# Vantagem Hardening

Endurecer o que já existe sob condições reais — sem adicionar features de produto.

## v1 (feito)

| Área | Medida |
|------|--------|
| Checkout | Preços e stock da BD; `FOR UPDATE`; `UPDATE … WHERE quantidade >= n` |
| Idempotência | `idempotencyKey` obrigatória em `POST /api/pedidos` |
| IDOR | Pedido e comprovativo só para dono ou admin |
| Upload | Magic bytes (JPEG/PNG/WEBP/GIF), rejeição de path traversal |
| Rate limit | Global `/api` + login/registo/recuperar + checkout + upload + cupão |
| CSRF | Token HMAC no cabeçalho (proxy Vercel) |
| Observabilidade | `X-Request-Id`, logs estruturados, `/health` e `/ready` (DB) |
| Testes unitários | Cupões/envio/IVA, MIME, CSRF assinado, códigos de erro |
| CI | GitHub Actions: typecheck + test + build |

## v2 (feito)

| Área | Medida |
|------|--------|
| Integração Postgres | CI com Postgres 16; teste de **checkout concorrente** + idempotência |
| Backup | [docs/backup.md](docs/backup.md) — `pg_dump` / Render / Aiven |
| Error webhook | `ERROR_WEBHOOK_URL` para 5xx (Sentry Relay ou equivalente) |
| Catálogo | [docs/catalogo-explain.md](docs/catalogo-explain.md) — EXPLAIN e índices |

## v3 (feito)

| Área | Medida |
|------|--------|
| E2E Playwright | Registo → checkout + comprovativo → admin confirma pagamento |
| CI E2E | Job com Postgres + API + Vite + Chromium ([docs/e2e.md](docs/e2e.md)) |

## Fora de âmbito (de propósito)

- Redis / filas / microserviços
- Rastreio de transportadora (removido)
- Redesign visual completo (fase seguinte: identidade própria)

## Como correr localmente

```bash
cd backend
npm test
npm run typecheck
```

E2E: ver [docs/e2e.md](docs/e2e.md).
